export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  // TODO: store feedback somewhere
  console.log("feedback", body);
  return { ok: true };
});
