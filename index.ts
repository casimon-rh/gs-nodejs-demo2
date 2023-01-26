import express, { Express, Request, Response } from 'express'
import axios, { AxiosResponse } from 'axios'
import CircuitBreaker from 'opossum'

interface CustomResponse {
  location: string
  data?: any
  error?: string
}

//? ------- ExpressJS --------------
const app: Express = express()
app.listen(3000, () => console.log('App listening on port 3000'))
//? ------- ExpressJS --------------

//* ------- Variables | Messages --------------
const jumps = process.env.JUMPS || 6
const throwError = () => Math.random() > .6 && process.env.INJECT_ERR === '1'
const curtime = () => `${new Date().getMinutes()}:${new Date().getSeconds()}`
const message = (data: any): CustomResponse => ({
  location: `\nThis is ${process.env.ID} @${curtime()}`,
  data
})
const errmsg = (err: any): CustomResponse => ({
  location: `\nThis is ${process.env.ID} @${curtime()}`,
  error: err || `\n${process.env.ID} @${curtime()} -> unavailable`
})
//* ------- Variables | Messages --------------

//! -------------- Circuit Breaker --------------
const breakerOptions = {
  timeout: 300,
  errorThresholdPercentage: 50,
  resetTimeout: 10000
}
const chain = (endpoint: string): Promise<CustomResponse> =>
  new Promise((resolve, reject) =>
    axios.get(endpoint)
      .then((response: AxiosResponse) => {
        resolve(message(response.data))
      }).catch((err: any) => {
        reject(errmsg(err.response.data))
      })
  )
const breaker = new CircuitBreaker(chain, breakerOptions)
//! -------------- Circuit Breaker --------------

// -------------- Endpoint --------------
app.get('/chain', async (req: Request, res: Response) => {
  const count = (parseInt(`${req.query['count']}`) || 0) + 1
  const endpoint = `${process.env.CHAIN_SVC}?count=${count}`
  if (throwError())
    return res.status(502).send(errmsg(''))
  if (count >= jumps)
    return res.status(200).send(message('\nLast'))
  try {
    const response = await breaker.fire(endpoint)
    res.status(200).send(response)
  } catch (error) {
    res.status(200).send(error)
  }
})
// -------------- Endpoint --------------

//? -------------- Events --------------
breaker.on("fallback", () => console.log('fallback'))
breaker.on("success", () => console.log("success"))
breaker.on("failure", () => console.log("failed"))
breaker.on("timeout", () => console.log("timed out"))
breaker.on("reject", () => console.log("rejected"))
breaker.on("open", () => console.log("opened"))
breaker.on("halfOpen", () => console.log("halfOpened"))
breaker.on("close", () => console.log("closed"))
//? -------------- Events --------------