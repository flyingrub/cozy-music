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

    onBeforeShow() {
        this.showChildView('header', new HeaderView({ model: this.model }));
        this.showChildView('tracks', new TracksView({
            collection: application.allTracks.get('tracks')
        }));
        this.setClass(application.appState.get('currentPlaylist'));
    },

    initialize() {
         this.listenTo(application.appState,
            'change:currentPlaylist',
            (appState, currentPlaylist) => {
                this.setClass(currentPlaylist);
            }
        );
    },

    setClass(currentPlaylist) {
        let type = currentPlaylist.get('tracks').type;
        this.$el.children('.tracks').get(0).className = 'tracks ' + type;
    },
});

export default Content;
