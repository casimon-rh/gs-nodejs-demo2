import express, { Express, Request, Response } from 'express'
import axios, { AxiosResponse } from 'axios'
import CircuitBreaker from 'opossum'

const app: Express = express()
app.listen(3000, () => console.log('App listening on port 3000'))

const jumps = process.env.JUMPS || 6
const throwError = () => Math.random() > .6 && process.env.INJECT_ERR === '1'
const m = `hello from ${process.env.ID}\n`
const curtime = () => `${new Date().getMinutes()}:${new Date().getSeconds()}`
const message = (data: string) =>
  `\nThis is ${process.env.ID} @${curtime()} -> Next ${data}`
const errmsg = () =>
  `\n${process.env.ID} @${curtime()} -> unavailable`

const breakerOptions = {
  timeout: 300, // If name service takes longer than .3 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 20% of requests fail, trip the breaker
  resetTimeout: 10000 // After 10 seconds, try again.
}

const chain = (endpoint: string): Promise<string> =>
  new Promise((resolve, reject) =>
    axios.get(endpoint)
      .then((response: AxiosResponse) => {
        resolve(message(response.data))
      }).catch((err: any) => {
        reject(message(err.response.data))
      })
  )

const breaker = new CircuitBreaker(chain, breakerOptions)

app.get('/', (req: Request, res: Response) => res.send(m))

app.get('/chain', async (req: Request, res: Response) => {
  const count = (parseInt(`${req.query['count']}`) || 0) + 1
  const endpoint = `${process.env.CHAIN_SVC}?count=${count}`

  if (throwError())
    return res.status(502).send(message(errmsg()))
  if (count >= jumps)
    return res.status(200).send('\nLast')
  try {
    const response = await breaker.fire(endpoint)
    res.status(200).send(response)
  } catch (error) {
    res.status(200).send(error)
  }
})

breaker.on("fallback", () => console.log('fallback'))
breaker.on("success", () => console.log("success"))
breaker.on("failure", () => console.log("failed"))
breaker.on("timeout", () => console.log("timed out"))
breaker.on("reject", () => console.log("rejected"))
breaker.on("open", () => console.log("opened"))
breaker.on("halfOpen", () => console.log("halfOpened"))
breaker.on("close", () => console.log("closed"))