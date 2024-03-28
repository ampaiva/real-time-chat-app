import { createSchema, createPubSub } from 'graphql-yoga'

import { Repeater } from 'graphql-yoga';

const pubSub = createPubSub();

var messages = [];

export const schema = createSchema({
    typeDefs: `
    type Message {
        id: ID!
        name: String!
        text: String!
    }

    type Query {
        messages: [Message!]
    }

    type Mutation{
        postMessage(name: String!, text: String!) : ID!
    }

    type Subscription {
        messages: [Message!]
    }
    `,
    resolvers: {
        Query: {
            messages: () => messages
        },
        Mutation: {
            postMessage: (parent, { name, text }) => {
                const id = messages.length;
                messages.push({
                    id,
                    name,
                    text
                });
                pubSub.publish("messages", { messages })
                return id;
            }
        }, 
        Subscription: {
            messages: {
                subscribe: () => {
                    return Repeater.merge(
                        [
                            new Repeater(async (push, stop) => {
                                push({ messages });
                                await stop;
                            }),
                            // Allows clients to subscribe to real-time updates of messages                        
                            pubSub.subscribe("messages"),
                        ]
                    )
                }
            }
        }
    }
})