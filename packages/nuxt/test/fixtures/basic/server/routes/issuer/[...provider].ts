import {
  exportJWK,
  generateKeyPair,
  SignJWT,
} from 'jose'

let signingKeys: Awaited<ReturnType<typeof createSigningKeys>> | undefined

async function createSigningKeys() {
  const pair = await generateKeyPair('RS256')
  return {
    privateKey: pair.privateKey,
    publicJwk: {
      ...await exportJWK(pair.publicKey),
      alg: 'RS256',
      kid: 'fixture-key',
      use: 'sig',
    },
  }
}

function keys() {
  return signingKeys ? Promise.resolve(signingKeys) : createSigningKeys().then((value) => {
    signingKeys = value
    return value
  })
}

const issuer = 'http://127.0.0.1:4010/issuer'

export default defineEventHandler(async (event) => {
  const route = getRouterParam(event, 'provider') ?? ''

  if (route === '.well-known/openid-configuration') {
    return {
      issuer,
      authorization_endpoint: `${issuer}/oauth2/authorize`,
      token_endpoint: `${issuer}/oauth2/token`,
      userinfo_endpoint: `${issuer}/oauth2/userinfo`,
      jwks_uri: `${issuer}/jwks`,
      end_session_endpoint: `${issuer}/oauth2/end-session`,
      code_challenge_methods_supported: ['S256'],
    }
  }

  if (route === 'oauth2/authorize') {
    const query = getQuery(event)
    const redirectUri = String(query.redirect_uri ?? '')
    const state = String(query.state ?? '')
    const nonce = String(query.nonce ?? '')
    const subject = getHeader(event, 'x-mock-subject') === 'denied'
      ? 'denied-subject'
      : 'fixture-subject'
    const code = Buffer.from(JSON.stringify({ nonce, subject })).toString('base64url')
    return sendRedirect(event, `${redirectUri}?${new URLSearchParams({ code, state })}`, 302)
  }

  if (route === 'oauth2/token') {
    const body = new URLSearchParams(await readRawBody(event) ?? '')
    const encoded = body.get('code') ?? ''
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      nonce: string
      subject: string
    }
    const { privateKey } = await keys()
    const idToken = await new SignJWT({
      nonce: payload.nonce,
      email: payload.subject === 'denied-subject' ? 'denied@example.com' : 'admin@example.com',
      email_verified: true,
      name: payload.subject === 'denied-subject' ? 'Denied User' : 'Fixture Admin',
      preferred_username: payload.subject === 'denied-subject' ? 'denied' : 'fixture-admin',
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'fixture-key' })
      .setIssuer(issuer)
      .setAudience('fixture-web')
      .setSubject(payload.subject)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey)
    return {
      access_token: 'fixture-access-token',
      token_type: 'Bearer',
      id_token: idToken,
    }
  }

  if (route === 'jwks') {
    const { publicJwk } = await keys()
    return { keys: [publicJwk] }
  }

  if (route === 'oauth2/end-session') {
    const query = getQuery(event)
    return sendRedirect(event, String(query.post_logout_redirect_uri ?? '/login'), 302)
  }

  throw createError({ statusCode: 404 })
})
