import { createServer } from 'node:http'
import { createYoga } from 'graphql-yoga'
import { useServer } from 'graphql-ws/lib/use/ws'
import { WebSocketServer } from 'ws'
import { schema } from './schema.js'

// Create a new instance of graphql-yoga with the predefined schema
const yoga = createYoga({
    schema: schema
})

// Create a standard Node.js HTTP server with the yoga application
const server = createServer(yoga)

// Create a WebSocket server that attaches to the HTTP server
const wsServer = new WebSocketServer({
    server: server,
    //    path: yoga.graphqlEndpoint
})

// Integrate graphql-yoga with the WebSocket server using graphql-ws
useServer(
    {
        execute: (args) => args.execute(args),
        subscribe: (args) => args.subscribe(args),
        // To handle the incoming subscription requests
        onSubscribe: async (ctx, msg) => {
            const { schema, execute, subscribe, contextFactory, parse, validate } =
                // To get the necessary functions and context for executing GraphQL operations.
                yoga.getEnveloped({
                    ...ctx,
                    req: ctx.extra.request,
                    socket: ctx.extra.socket,
                    params: msg.payload
                })

            // parses and validates the subscription request and returns the arguments needed for execution.
            const args = {
                schema,
                operationName: msg.payload.operationName,
                document: parse(msg.payload.query),
                variableValues: msg.payload.variables,
                contextValue: await contextFactory(),
                execute,
                subscribe
            }

            const errors = validate(args.schema, args.document)
            if (errors.length) return errors
            return args
        }
    },
    wsServer
);

server.listen(4000, () => {
    console.info(`Server is running on http://localhost:4000/graphql`)
})