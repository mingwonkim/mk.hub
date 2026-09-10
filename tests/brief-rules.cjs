const {test, before, after} = require('node:test');
const fs = require('node:fs');
const {initializeTestEnvironment, assertFails, assertSucceeds} = require('@firebase/rules-unit-testing');
const {doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc, deleteField} = require('firebase/firestore');
let env;
const owner = {email: 'kmin5940@naver.com', email_verified: true, vault_owner: true,
  vault_access: true, vault_otp_at: Date.now(), vault_version: 1};
const path = 'mk_app/data/briefs/2026-09-10';
before(async () => {
  env = await initializeTestEnvironment({projectId: 'demo-brief-rules', firestore: {
    host: '127.0.0.1', port: 8080, rules: fs.readFileSync('security/firestore.rules', 'utf8')}});
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'mk_security/access'), {version: 1});
    await setDoc(doc(ctx.firestore(), path), {html: '<p>fixture</p>', urls: ['https://example.com/a'], read: false});
  });
});
after(async () => {if (env) await env.cleanup();});
test('Owner reads briefs and changes only boolean read state', async () => {
  const db = env.authenticatedContext('owner', owner).firestore();
  await assertSucceeds(getDoc(doc(db, path)));
  await assertSucceeds(getDocs(collection(db, 'mk_app/data/briefs')));
  await assertSucceeds(updateDoc(doc(db, path), {read: true}));
  await assertSucceeds(updateDoc(doc(db, path), {read: false}));
  for (const fields of [{html: '<script>attack</script>'}, {urls: []}, {count: 0},
    {read: true, html: 'attack'}, {read: 'true'}, {read: deleteField()}]) {
    await assertFails(updateDoc(doc(db, path), fields));
  }
});
test('No client can create briefs or write nested documents', async () => {
  const db = env.authenticatedContext('owner', owner).firestore();
  await assertFails(setDoc(doc(db, 'mk_app/data/briefs/forged'), {html: 'attack', read: false}));
  await assertFails(setDoc(doc(db, path + '/nested/forged'), {html: 'attack'}));
});
test('Anonymous, other and expired accounts cannot access briefs', async () => {
  for (const ctx of [env.unauthenticatedContext(), env.authenticatedContext('anonymous'),
    env.authenticatedContext('other', {...owner, email: 'other@example.com'}),
    env.authenticatedContext('expired', {...owner, vault_otp_at: Date.now() - 43200001})]) {
    const ref = doc(ctx.firestore(), path);
    await assertFails(getDoc(ref));
    await assertFails(updateDoc(ref, {read: true}));
    await assertFails(deleteDoc(ref));
  }
});
test('Owner retains other app writes and brief deletion', async () => {
  const db = env.authenticatedContext('owner', owner).firestore();
  for (const p of ['mk_app/hub_memo', 'mk_app/data/memos/fixture', 'mk_app/data/files/fixture']) {
    await assertSucceeds(setDoc(doc(db, p), {text: 'fixture'}));
  }
  await assertSucceeds(deleteDoc(doc(db, path)));
});
