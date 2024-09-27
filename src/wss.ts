import { Server as WSServer } from 'ws';
import Strm from '@leetim25/strm';
import { throttle } from 'lodash';

import { STRM_API_URL, STRM_CS_URL, STRM_PD_URL } from './common/config';
import { getOneById as getDeckById } from './model/deck';
import { parseUrlQueryParams } from './common/helpers';
import { getStrmToken } from './common/strm';

const conns = {};

const wsServer = new WSServer({
    noServer: true,
    clientTracking: true
});

wsServer.on('connection', async (ws, request, client) => {
    ws.send('Socket open');
    const params = parseUrlQueryParams(request.url);
    const deckId = params['deck_id'];
    // TODO: get token instead of user_id, then look up user_id based on the token.
    const userId = params['user_id'];
    if (!deckId || !userId) {
        ws.close();
        return;
    }

    const deck = await getDeckById(userId, deckId);
    ws.deck = deck;

    let conn = conns[deck.strmId];
    if (!conn) {
        conn = await getNewStrmConnection(deck.strmId, deck.strmPatchKey);
        conn.onChange((doc, revisionNumber) => {
            // TODO: validate doc
            wsServer.clients.forEach(client => {
                if (client.deck.strmId === deck.strmId) {
                    client.send(JSON.stringify({
                        slides: doc.slides,
                        currentSlide: doc.currentSlide,
                        revisionNumber
                    }));
                }
            });
            throttledUpdateDeck(deck, {
                slides: doc.slides,
                currentSlide: doc.currentSlide
            });
            deck.slides = doc.slides;
            deck.currentSlide = doc.currentSlide;
        });
        conn.init();
        conn.connect();
        conns[deck.strmId] = conn;
    }
    
    ws.on('message', message => {
        const obj = JSON.parse(message.toString('utf-8'));
        switch(obj.action) {
            case 'next':
                conn.put({
                    slides: ws.deck.slides,
                    currentSlide: ws.deck.currentSlide + 1
                });
                break;
            case 'prev':
                conn.put({
                    slides: ws.deck.slides,
                    currentSlide: ws.deck.currentSlide - 1
                });
                break;
        }
    });
});

export default wsServer;

async function getNewStrmConnection(strmId: string, strmActionKey: string) {
    const strmToken = await getStrmToken();
    const strmClient = new Strm(strmId, strmToken, {
        api_url: `${STRM_API_URL}/api/v1/docs`,
        ws_url: STRM_CS_URL,
        pd_url: STRM_PD_URL,
        action_key: strmActionKey
    });
    
    return strmClient;
}

function updateDeck(deck, data) {
    deck.slides = data.slides;
    deck.currentSlide = data.currentSlide;
    deck.save();
};

const throttledUpdateDeck = throttle(updateDeck, 500);
