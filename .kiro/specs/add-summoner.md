# Add Summoner Specification

## 1. Goal

- Allow users to manage a list of summoners for team balancing in Version 3.
- Max 10 active summoners in active list (split into Team 1 and Team 2, 5 rows x 2 columns).
- Support unauthenticated persistence using `localStorage`.
- Support future authenticated sync when user login feature is available.

## 2. User Flow

- User types a summoner name into the input field in the left settings column (4-column area).
- User presses `Enter` or clicks `Add` button to append the summoner.
- New summoners are added in order.
- Active list (first 10 summoners) is displayed in a 5 rows x 2 columns grid corresponding to Team 1 and Team 2.
- Summoners are auto-distributed evenly across both teams (e.g. index 0,2,4,6,8 to Team 1 and 1,3,5,7,9 to Team 2).
- Each summoner item displays the summoner name and an optional Power Number.
- Power Number is visible only when `Power Evaluate` setting toggle is enabled.
- Edit and Delete action buttons are shown when hovering over a summoner item.
- Edit and Delete actions trigger confirmation dialogs before making changes.
- Drag & Drop support allows reordering/swapping summoners across slots or teams.
- On page reload, the summoner list and settings are restored from `localStorage`.

## 3. Active vs Inactive Summoners

- The total list can store more than 10 summoners.
- Only the top 10 summoners are active and participate in the 5x2 team grid.
- Summoners past the 10th item are rendered in subsequent rows as inactive/disabled items.
- Drag & drop allows dragging an inactive summoner into an active slot to swap/replace positions.

## 4. Business Rules

- **Edit Confirmation**: Clicking Edit opens a dialog confirming the new name and optional power number.
- **Delete Confirmation**: Clicking Delete opens a dialog asking for confirmation before removal.
- **Drag & Drop Reordering**:
  - Dragging between active items performs a direct slot swap to prevent unintended position shifts.
  - Dragging between active and inactive items swaps their positions.
  - While holding an item over a drop target, a preview drop target highlight is displayed.
  - Changes are committed only upon drop event.
