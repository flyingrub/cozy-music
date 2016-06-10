import Mn from 'backbone.marionette';
import HeaderView from './header';
import TracksView from './tracks';
import application from '../application';


const Content = Mn.LayoutView.extend({

    template: require('./templates/content'),

    regions: {
        header: '[role="complementary"]',
        tracks: '.tracks',
    },

    modelEvents: {
        'change:currentPlaylist': 'switchPlaylist'
    },

    onBeforeShow () {
        this.showChildView('header', new HeaderView({ model: this.model }));
        this.switchPlaylist(null, this.model.get('currentPlaylist'));
    },

    // only the router change the current playlist
    switchPlaylist (appState, currentPlaylist) {
        this.showChildView('tracks', new TracksView({
            collection: currentPlaylist.get('tracks')
        }));
    }
});

export default Content;
