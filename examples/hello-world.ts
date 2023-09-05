import { defineCommand, runMain } from 'citty'

const main = defineCommand({
  meta: {
    name: 'hello-world',
    version: '1.0.0',
    description: 'The most basic command ever',
  },
  run() {
    console.log('Hello World!')
  }
})

runMain(main)
