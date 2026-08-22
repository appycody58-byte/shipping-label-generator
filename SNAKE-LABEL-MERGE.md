# Merging the forked snake-label thermal magic

The repo `typingbeaver/snake-label` was forked into your account.

It specializes in converting German DHL/Hermes shipping labels for Brother QL 62mm thermal printers.

## How to merge the power

1. Once the fork appears (check https://github.com/appycody58-byte?tab=repositories):
   ```bash
   git remote add snake https://github.com/appycody58-byte/snake-label.git
   git fetch snake
   git checkout -b merge-snake
   git merge snake/master --allow-unrelated-histories
   ```

2. Key ideas to steal:
   - Offline label conversion pipeline
   - Brother QL direct print support
   - 62mm / 4x6 thermal format handling

3. After merge, we can add a `thermal-convert.js` that takes our generated labels and pipes them through snake-label logic for perfect Brother QL output.

The fork is already initiated. When it lands we finish the merge and the thermal pipeline becomes unstoppable.
