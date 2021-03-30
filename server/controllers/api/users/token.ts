import { forwardTokenReq, handleLogin, handleTokenRevocation } from '@server/lib/auth'
import * as RateLimit from 'express-rate-limit'
import { CONFIG } from '@server/initializers/config'
import * as express from 'express'
import { Hooks } from '@server/lib/plugins/hooks'
import { asyncMiddleware, authenticate } from '@server/middlewares'
import { ScopedToken } from '@shared/models/users/user-scoped-token'
import { v4 as uuidv4 } from 'uuid'

const tokensRouter = express.Router()

const loginRateLimiter = RateLimit({
  windowMs: CONFIG.RATES_LIMIT.LOGIN.WINDOW_MS,
  max: CONFIG.RATES_LIMIT.LOGIN.MAX
})

tokensRouter.post('/token',
  loginRateLimiter,
  handleLogin,
  tokenSuccess
)

tokensRouter.post('/revoke-token',
  authenticate,
  asyncMiddleware(handleTokenRevocation)
)

tokensRouter.get('/external',
  getExternalConnectServer
)

tokensRouter.post('/verify-external-token',
  loginRateLimiter,
  verify,
  tokenSuccess
)

tokensRouter.get('/scoped-tokens',
  authenticate,
  getScopedTokens
)

tokensRouter.post('/scoped-tokens',
  authenticate,
  asyncMiddleware(renewScopedTokens)
)

// ---------------------------------------------------------------------------

export {
  tokensRouter
}
// ---------------------------------------------------------------------------

interface PubKey{
  publickey: string;
}
const request = require('request');

function get<T>(url): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
	    	return
	    }
            let res = JSON.parse(body)
            resolve(res);
        });
    });
}

function post<T>(url, params): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        request.post(url, {form:params}, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>: ' + body );
	    	return
	    }
            let res = JSON.parse(body)
            resolve(res);
        });
    });
}
function makeid(length) {
  let result           = ''
  let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let charactersLength = characters.length
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result;
}
async function getExternalConnectServer(req: express.Request, res: express.Response){
  try{
    let pubkey = (await get<PubKey>('https://oauth.threefold.io/pubkey')).publickey
    let state = makeid(32)
    let params = {
      "state": state,
      "appid": req.hostname,
      "scope": JSON.stringify({"user": true, "email": true}),
      "redirecturl": "/login",
      "publickey": pubkey,
    }
    let url = new URL('https://login.threefold.me/');
    url.search = new URLSearchParams(params).toString()
    return res.json({url: url, state: state})
  }catch (error){
    console.log(error)
    return res.json({error: 'Couldn\'t fetch the pubkey of oauth server'})
  }
}

interface UserData{
  username: string;
  email: string;
}

async function verify(req: express.Request, res: express.Response, next: express.NextFunction){
  try{
    let signedAttempt = req.body.signedAttempt
    let state = req.body.state
    console.log(signedAttempt)
    let params = {'signedAttempt': signedAttempt, 'state': state}
    let data: UserData = await(post<UserData>('https://oauth.threefold.io/verify', params))
    res.locals.bypassLogin = {
        bypass: true,
        pluginName: 'threefoldconnect',
        authName: 'threefoldconnect',
        user: {
          username: data.username,
          email: data.email,
          role: 2,
          displayName: data.username
        }
      }

    return forwardTokenReq(req, res, next)
  }catch(error){
    console.log(error)
    return res.json({error: "Verification failed"})
  }
}


function tokenSuccess (req: express.Request) {
  const username = req.body.username

  Hooks.runAction('action:api.user.oauth2-got-token', { username, ip: req.ip })
}

function getScopedTokens (req: express.Request, res: express.Response) {
  const user = res.locals.oauth.token.user

  return res.json({
    feedToken: user.feedToken
  } as ScopedToken)
}

async function renewScopedTokens (req: express.Request, res: express.Response) {
  const user = res.locals.oauth.token.user

  user.feedToken = uuidv4()
  await user.save()

  return res.json({
    feedToken: user.feedToken
  } as ScopedToken)
}