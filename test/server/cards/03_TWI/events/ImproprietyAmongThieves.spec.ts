describe('Impropriety Among Thieves', function () {
    integration(function (contextRef) {
        describe('Impropriety Among Thieves\'s event ability', function () {
            describe('when there are no ready non-leader units in play', function () {
                beforeEach(async function () {
                    await contextRef.setupTestAsync({
                        phase: 'action',
                        player1: {
                            hand: ['impropriety-among-thieves'],
                            groundArena: [{ card: 'superlaser-technician', exhausted: true }],
                            leader: { card: 'boba-fett#daimyo', deployed: true },
                        },
                        player2: {
                            groundArena: [{ card: 'seasoned-shoretrooper', exhausted: true }],
                            leader: { card: 'sabine-wren#galvanized-revolutionary', deployed: true },
                        }
                    });
                });

                it('does nothing', () => {
                    const { context } = contextRef;

                    context.player1.clickCard(context.improprietyAmongThieves);

                    expect(context.player2).toBeActivePlayer();
                    expect(context.superlaserTechnician).toBeInZone('groundArena', context.player1);
                    expect(context.seasonedShoretrooper).toBeInZone('groundArena', context.player2);
                });
            });

            describe('when there are ready non-leader units in play', function () {
                beforeEach(async function () {
                    await contextRef.setupTestAsync({
                        phase: 'action',
                        player1: {
                            hand: ['impropriety-among-thieves'],
                            groundArena: ['superlaser-technician'],
                            leader: { card: 'boba-fett#daimyo', deployed: true },
                        },
                        player2: {
                            groundArena: ['seasoned-shoretrooper', { card: 'scanning-officer', exhausted: true }],
                            leader: { card: 'sabine-wren#galvanized-revolutionary', deployed: true },
                        }
                    });
                });

                it('exchanges control of the chosen units and returns control at the start of the regroup phase', () => {
                    const { context } = contextRef;

                    context.player1.clickCard(context.improprietyAmongThieves);
                    expect(context.player1).toHavePrompt('Choose a friendly ready non-leader unit');
                    expect(context.player1).toBeAbleToSelectExactly(context.superlaserTechnician);

                    context.player1.clickCard(context.superlaserTechnician);
                    expect(context.player1).toHavePrompt('Choose an enemy ready non-leader unit');
                    expect(context.player1).toBeAbleToSelectExactly(context.seasonedShoretrooper);

                    context.player1.clickCard(context.seasonedShoretrooper);

                    expect(context.player2).toBeActivePlayer();
                    expect(context.superlaserTechnician).toBeInZone('groundArena', context.player2);
                    expect(context.seasonedShoretrooper).toBeInZone('groundArena', context.player1);

                    context.moveToRegroupPhase();

                    expect(context.superlaserTechnician).toBeInZone('groundArena', context.player1);
                    expect(context.seasonedShoretrooper).toBeInZone('groundArena', context.player2);
                });
            });

            describe('when a unit is taken with traitorous ability', function () {
                beforeEach(async function () {
                    await contextRef.setupTestAsync({
                        phase: 'action',
                        player1: {
                            hand: ['impropriety-among-thieves'],
                            groundArena: ['superlaser-technician', 'seasoned-shoretrooper'],
                            leader: { card: 'boba-fett#daimyo', deployed: true },
                        },
                        player2: {
                            hand: ['traitorous'],
                            groundArena: [{ card: 'scanning-officer', exhausted: true }],
                            leader: { card: 'sabine-wren#galvanized-revolutionary', deployed: true },
                        }
                    });
                });

                it('returns control of the unit to the owner at the start of the regroup phase', () => {
                    const { context } = contextRef;
                    context.player1.passAction();

                    context.player2.clickCard(context.traitorous);
                    context.player2.clickCard(context.seasonedShoretrooper);
                    context.player1.clickCard(context.improprietyAmongThieves);
                    expect(context.player1).toHavePrompt('Choose a friendly ready non-leader unit');
                    expect(context.player1).toBeAbleToSelectExactly(context.superlaserTechnician);

                    context.player1.clickCard(context.superlaserTechnician);
                    expect(context.player1).toHavePrompt('Choose an enemy ready non-leader unit');
                    expect(context.player1).toBeAbleToSelectExactly(context.seasonedShoretrooper);

                    context.player1.clickCard(context.seasonedShoretrooper);

                    expect(context.player2).toBeActivePlayer();
                    expect(context.superlaserTechnician).toBeInZone('groundArena', context.player2);
                    expect(context.seasonedShoretrooper).toBeInZone('groundArena', context.player1);

                    context.moveToRegroupPhase();

                    expect(context.superlaserTechnician).toBeInZone('groundArena', context.player1);
                    expect(context.seasonedShoretrooper).toBeInZone('groundArena', context.player1);
                });
            });
        });
    });
});
