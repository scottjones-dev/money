import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { env } from './env'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

serve({ fetch: app.fetch, port: env.PORT }, (info) => { console.log(`Server is running on https://api.alicesystems.co.uk`) })
