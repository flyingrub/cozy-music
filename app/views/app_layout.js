import Mn from 'backbone.marionette';
import ContentView from './content';
import PlayerControlsView from './playerControls';
import PlayerControlsExtendedView from './playerControlsExtended';
import PlayerTimelineView from './playerTimeline';
import DialogView from './dialog';
import ToolbarView from './toolbar';
import application from '../application'


const AppLayout = Mn.LayoutView.extend({

    template: require('./templates/app_layout'),

    el: '[role="application"]',

    ui: {
        player: 'audio'
    },

    regions: {
        dialog: '[role="dialog"]',
        toolbar: '[role="toolbar"]',
        content: '[role="contentinfo"]',
        playerControls: '.play-controls',
        playerControlsExtended: '.controls-extended',
        playerTimeline: '.timeline'
    },

    onRender() {
        // Init the audio html element
        application.audio = this.ui.player.get(0);

        this.showChildView('content', new ContentView({
            model: application.appState
        }));
        this.showChildView('toolbar', new ToolbarView());

        // Player Views
        this.showChildView('playerControls', new PlayerControlsView({
            model: application.appState
        }));
        this.showChildView('playerControlsExtended', new PlayerControlsExtendedView({
            model: application.appState
        }));
        this.showChildView('playerTimeline', new PlayerTimelineView({
            model: application.appState
        }));

        application.channel.reply('dialog', this.showDialog, this);
    },

    showDialog(dialog) {
        this.showChildView(
            'dialog',
            new DialogView(dialog)
        );
    }
});

export default AppLayout;
