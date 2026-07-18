export default defineEventHandler(event => ({
  ok: true,
  principalId: event.context.authPrincipal?.id,
}))
