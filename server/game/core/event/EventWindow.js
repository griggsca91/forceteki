const { BaseStepWithPipeline } = require('../gameSteps/BaseStepWithPipeline.js');
const { TriggeredAbilityWindow } = require('../gameSteps/abilityWindow/TriggeredAbilityWindow');
const { SimpleStep } = require('../gameSteps/SimpleStep.js');
const { AbilityType } = require('../Constants.js');
const { default: Contract } = require('../utils/Contract.js');
// const KeywordAbilityWindow = require('../gamesteps/keywordabilitywindow.js');

class EventWindow extends BaseStepWithPipeline {
    constructor(game, events) {
        super(game);

        this.events = [];
        this.thenAbilitySteps = [];
        events.forEach((event) => {
            if (!event.cancelled) {
                this.addEvent(event);
            }
        });

        this.toStringName = `'EventWindow: ${this.events.map((event) => event.name).join(', ')}'`;

        this.triggeredAbilityWindow = null;

        this.initialise();
    }

    initialise() {
        this.pipeline.initialise([
            new SimpleStep(this.game, () => this.setCurrentEventWindow(), 'setCurrentEventWindow'),
            new SimpleStep(this.game, () => this.checkEventCondition(), 'checkEventCondition'),
            new SimpleStep(this.game, () => this.openReplacementEffectWindow(), 'openReplacementEffectWindow'),
            new SimpleStep(this.game, () => this.createContingentEvents(), 'createContingentEvents'),
            new SimpleStep(this.game, () => this.preResolutionEffects(), 'preResolutionEffects'),
            new SimpleStep(this.game, () => this.executeHandler(), 'executeHandler'),
            new SimpleStep(this.game, () => this.resolveGameState(), 'resolveGameState'),    // TODO EFFECTS: uncomment this (and other places the method is used, + missing ones from l5r)
            new SimpleStep(this.game, () => this.checkThenAbilitySteps(), 'checkThenAbilitySteps'),
            new SimpleStep(this.game, () => this.openTriggeredAbilityWindow(), 'openTriggeredAbilityWindow'),
            new SimpleStep(this.game, () => this.resetCurrentEventWindow(), 'resetCurrentEventWindow')
        ]);
    }

    addEvent(event) {
        event.setWindow(this);
        this.events.push(event);
        return event;
    }

    removeEvent(event) {
        this.events = this.events.filter((e) => e !== event);
        return event;
    }

    addThenAbilityStep(ability, context, condition = (event) => event.isFullyResolved(event)) {
        this.thenAbilitySteps.push({ ability, context, condition });
    }

    setCurrentEventWindow() {
        this.previousEventWindow = this.game.currentEventWindow;
        this.game.currentEventWindow = this;
    }

    checkEventCondition() {
        this.events.forEach((event) => event.checkCondition());
    }

    openReplacementEffectWindow() {
        if (this.events.length === 0) {
            return;
        }

        // TODO EFFECTS: will need resolution for replacement effects here
        // not sure if it will need a new window class or can just reuse the existing one
        const window = new TriggeredAbilityWindow(this.game, this, AbilityType.ReplacementEffect);
        window.emitEvents();
        this.queueStep(window);
    }

    /**
     * Creates any "contingent" events which will happen in the same window as the primary event
     * but will be resolved after it in order. The main use case for this is upgrades being
     * defeated at the same time as the parent card holding them.
     */
    createContingentEvents() {
        let contingentEvents = [];
        this.events.forEach((event) => {
            contingentEvents = contingentEvents.concat(event.createContingentEvents());
        });
        contingentEvents.forEach((event) => this.addEvent(event));
    }

    preResolutionEffects() {
        this.events.forEach((event) => event.preResolutionEffect());
    }

    executeHandler() {
        this.eventsToExecute = this.events.sort((event) => event.order);

        // we emit triggered abilities here to ensure that they get triggered in case e.g. a card is defeated during event resolution
        this.triggerEventsForWindow();

        for (const event of this.eventsToExecute) {
            // need to checkCondition here to ensure the event won't fizzle due to another event's resolution (e.g. double honoring an ordinary character with YR etc.)
            event.checkCondition();
            if (!event.cancelled) {
                event.executeHandler();
                this.game.emit(event.name, event);
            }
        }

        // TODO: make it so we don't need to trigger twice
        // trigger again here to catch any events for cards that entered play during event resolution
        this.triggerEventsForWindow();
    }

    triggerEventsForWindow() {
        if (this.triggeredAbilityWindow === null) {
            this.triggeredAbilityWindow = new TriggeredAbilityWindow(this.game, this, AbilityType.Triggered);
        }
        this.triggeredAbilityWindow.emitEvents();
    }

    resolveGameState() {
        this.eventsToExecute = this.eventsToExecute.filter((event) => !event.cancelled);

        // TODO: understand if this needs to be called with the eventsToExecute array
        this.game.resolveGameState(this.eventsToExecute.some((event) => event.handler), this.eventsToExecute);
    }

    // resolve any "then" abilities
    checkThenAbilitySteps() {
        for (const cardAbilityStep of this.thenAbilitySteps) {
            if (cardAbilityStep.context.events.every((event) => cardAbilityStep.condition(event))) {
                this.game.resolveAbility(cardAbilityStep.ability.createContext(cardAbilityStep.context.player));
            }
        }
    }

    openTriggeredAbilityWindow() {
        if (this.events.length === 0) {
            return;
        }

        this.queueStep(this.triggeredAbilityWindow);
    }

    resetCurrentEventWindow() {
        if (this.previousEventWindow) {
            this.previousEventWindow.checkEventCondition();
            this.game.currentEventWindow = this.previousEventWindow;
        } else {
            this.game.currentEventWindow = null;
        }
    }

    /** @override */
    toString() {
        return this.toStringName;
    }
}

module.exports = EventWindow;
