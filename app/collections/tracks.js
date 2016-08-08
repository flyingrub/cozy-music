import Backbone from 'backbone';
import Track from '../models/track';
import cozysdk from 'cozysdk-client';
import application from '../application'

const Tracks = Backbone.Collection.extend({

    model: Track,

    sync(method, model, options) {
        if (method == 'read') {
            let promise = cozysdk.queryView('Track', 'playable', options.data)
            promise.then((res) => {
                if (options && options.success) {
                    options.success(res);
                }
            })
            promise.catch((err) => {
                if (options && options.error) {
                    options.error(err);
                }
            });
            return promise;
        }
    },

    parse(tracks, options) {
        let result = [];
        for (let i = 0; i < tracks.length; i++) {
            result.push(tracks[i].value);
        }
        return result;
    }
});

// COZYSDK : Requests \\
cozysdk.defineView('File', 'music', (doc) => {
        if (doc.class == 'music') {
            emit(doc.name, doc);
        }
    }, (error, response) => {
});

cozysdk.defineView('Track', 'all', (doc) => {
    if (!doc._attachments) {
        emit(doc._id, doc);
    }
    }, (error, response) => {
});

cozysdk.defineView('Track', 'oldDoctype', (doc) => {
        if (doc.title) {
            emit(doc._id, doc);
        }
    }, (error, response) => {
});

cozysdk.defineView('Track', 'playable', (doc) => {
        if (!doc.hidden && doc.metas) {
            emit(doc.metas.title, doc);
        }
    }, (error, response) => {
});

cozysdk.defineView('Track', 'file', (doc) => {
        if (doc.ressource.type == 'file') {
            emit(doc._id, doc.ressource.fileID);
        }
    }, (error, response) => {
});

cozysdk.defineView('Track', 'allFileTrack', (doc) => {
    if (doc.ressource.type == 'file') {
        emit(doc._id, doc);
    }
}, callback);

cozysdk.defineView('Track', 'soundcloud', (doc) => {
        if (doc.ressource.type == 'soundcloud') {
            emit(doc._id, doc);
        }
    }, (error, response) => {
});

export default Tracks;
