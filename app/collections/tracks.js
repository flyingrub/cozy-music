import Backbone from 'backbone';
import Track from '../models/track';
import cozysdk from 'cozysdk-client';
import application from '../application'

const Tracks = Backbone.Collection.extend({

    model: Track,

    sync(method, model, options) {
        if (method == 'read') {
            let promise = new Promise((resolve, reject) => {
                cozysdk.run('Track', 'playable', options.data, (err, res) => {
                    if (res) {
                        if (options && options.success) {
                            options.success(res);
                            resolve(res);
                        }
                    } else {
                        if (options && options.error) {
                            options.error(err);
                            reject(err);
                        }
                    }
                });
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
cozysdk.defineRequest('File', 'music', (doc) => {
        if (doc.class == 'music') {
            emit(doc.name, doc);
        }
    }, (error, response) => {
});

cozysdk.defineRequest('Track', 'all', (doc) => {
    if (!doc._attachments) {
        emit(doc._id, doc);
    }
    }, (error, response) => {
});

cozysdk.defineRequest('Track', 'oldDoctype', (doc) => {
        if (doc.title) {
            emit(doc._id, doc);
        }
    }, (error, response) => {
});

cozysdk.defineRequest('Track', 'playable', (doc) => {
        if (!doc.hidden && doc.metas) {
            emit(doc.metas.title, doc);
        }
    }, (error, response) => {
});

cozysdk.defineRequest('Track', 'file', (doc) => {
        if (doc.ressource.type == 'file') {
            emit(doc._id, doc);
        }
    }, (error, response) => {
});

cozysdk.defineRequest('Track', 'soundcloud', (doc) => {
        if (doc.ressource.type == 'soundcloud') {
            emit(doc._id, doc);
        }
    }, (error, response) => {
});

export default Tracks;
