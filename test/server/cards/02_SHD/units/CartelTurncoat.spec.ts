describe('Cartel Turncoat', function() {
    integration(function(contextRef) {
        describe('Cartel Turncoat\'s Bounty ability', function() {
            it('should draw a card', async function () {
                await contextRef.setupTestAsync({
                    phase: 'action',
                    player1: {
                        spaceArena: ['cartel-turncoat']
                    },
                    player2: {
                        spaceArena: ['razor-crest#reliable-gunship']
                    }
                });

                const { context } = contextRef;

                context.player1.clickCard(context.cartelTurncoat);
                context.player1.clickCard(context.razorCrest);

                expect(context.player2).toHavePassAbilityPrompt('Collect Bounty: Draw a card');
                context.player2.clickPrompt('Trigger');

                expect(context.player1.handSize).toBe(0);
                expect(context.player2.handSize).toBe(1);
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
