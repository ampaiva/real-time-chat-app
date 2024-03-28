import React, { useRef, useEffect, useState } from "react";
import { ApolloClient, InMemoryCache, ApolloProvider, useQuery, gql, useMutation, useSubscription } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';

import { TextBoxComponent } from '@syncfusion/ej2-react-inputs';

import { ListViewComponent } from '@syncfusion/ej2-react-lists';
import { registerLicense } from '@syncfusion/ej2-base'

registerLicense("<See secret.txt>");

const httpLink = new HttpLink({
    uri: 'http://localhost:4000/graphql'
});

const wsLink = new GraphQLWsLink(createClient({
    url: 'ws://localhost:4000/graphql'
}));

const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        );
    },
    wsLink,
    httpLink,
);

const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache()
});

const GET_MESSAGES = gql`
subscription {
    messages {
      id
      name
      text
    }
}`;

export const POST_MESSAGE = gql`
mutation ($name:String!, $text:String!) {
    postMessage(name: $name, text: $text)
}`;

const Messages = ({ user }) => {
    const listObj = useRef(null);
    const userName = "Hi " + user + ", Let's Chat!";

    function listTemplate(data) {
        const sendertemplate = (<div className="settings sender-settings">
            <div className="content sender-content">
                <div>{data.text}</div>
            </div>
        </div>);

        const receivertemplate = (<div className="settings receiver-settings">
            <div className="e-avatar e-avatar-circle">{data.user.split(' ').map(word => word.charAt(0)).join('').toUpperCase()}</div>
            <div className="content receiver-content">
                {data.text}
            </div>
        </div>);

        return <div>{data.type !== "receiver" ? sendertemplate : receivertemplate}</div>;
    }

    const { data } = useSubscription(GET_MESSAGES);
    let listdata = [];
    if (!data) {
        return null;
    }
    else {
        data.messages.map(({ id, name: messageUser, text }) => (
            listdata.push({ id: id, user: messageUser, text: text, type: user === messageUser ? "sender" : "receiver" })
        ))
    }

    function onActionComplete(args) {
        setTimeout(function () {
            if (listObj) {
                listObj.current.element.scrollTop = listObj.current.element.scrollHeight;
            }
        }, 0);
    }

    return (
        <>
            <ListViewComponent id='List' ref={listObj} dataSource={listdata} height="500px" headerTitle={userName} showHeader={true} statelessTemplates={['template']} template={listTemplate} actionComplete={onActionComplete} />
        </>
    )
}

const Chat = () => {
    const [state, setState] = React.useState({
        name: "",
        text: ""
    });
    useEffect(() => {
        setState({
            ...state,
            name: "User " + Math.floor(Math.random() * (9 - 1 + 1) + 1),
        })
    }, [])
    const [postMessage] = useMutation(POST_MESSAGE);
    const onSend = () => {
        if (state.text.length > 0) {
            postMessage({
                variables: state
            });
        }
        setState({
            ...state,
            text: ''
        })
    }
    return (
        <>
            <Messages user={state.name} />
            <div className="row custom-margin custom-padding-5">
                <div className="col-xs-12 col-sm-12 col-lg-12 col-md-12">
                    <div className="e-input-group">
                        <TextBoxComponent placeholder="Type a message" value={state.text} onBlur={(evt) => setState({
                            ...state,
                            text: evt.target.value,
                        })} />
                        <span className="e-input-group-icon e-send" onClick={() => onSend()}></span>
                    </div>
                </div>
            </div>
        </>
    )
}


export default () => (
    <ApolloProvider client={client}>
        <Chat />
    </ApolloProvider>
);
