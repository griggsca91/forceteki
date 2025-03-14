import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { WildcardCardType } from '../../../core/Constants';

export default class AllegiantGeneralPrydeRuthlessAndLoyal extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '9611596703',
            internalName: 'allegiant-general-pryde#ruthless-and-loyal',
        };
    }

    public override setupCardAbilities() {
        this.addTriggeredAbility({
            title: 'Defeat a non-unique upgrade on the unit',
            when: {
                onDamageDealt: (event) => event.isIndirect && event.card.isUnit(),
            },
            optional: true,
            targetResolver: {
                cardTypeFilter: WildcardCardType.Upgrade,
                cardCondition: (card, context) => !card.unique && card.isUpgrade() && card.parentCard === context.event.card,
                immediateEffect: AbilityHelper.immediateEffects.defeat(),
            }
        });

        this.addOnAttackAbility({
            title: 'Deal 2 indirect damage to a player',
            immediateEffect: AbilityHelper.immediateEffects.conditional({
                condition: (context) => context.player.hasInitiative(),
                onTrue: AbilityHelper.immediateEffects.selectPlayer({
                    innerSystem: AbilityHelper.immediateEffects.indirectDamageToPlayer({ amount: 2 }),
                }),
            })
        });
    }
}
