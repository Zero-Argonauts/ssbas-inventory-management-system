# Desktop Set Grouping Format

## Asset Tag Format
Assets with the following format will be automatically grouped into Desktop Sets:

```
SSBAS/{Type}/YYYY-YY/TXX
```

### Components:
- **SSBAS**: Prefix identifier
- **{Type}**: Peripheral type code (case-insensitive)
  - `Mo` = Monitor
  - `Ko` = Keyboard  
  - `Ro` = Mouse
  - `Co` = CPU
- **YYYY-YY**: Financial year (e.g., "2025-26")
- **TXX**: Unique set identifier (e.g., "T01", "T02")

## Examples

### Desktop Set 1 (2025-26)
- `SSBAS/Mo/2025-26/T01` - Monitor
- `SSBAS/Ko/2025-26/T01` - Keyboard
- `SSBAS/Ro/2025-26/T01` - Mouse
- `SSBAS/Co/2025-26/T01` - CPU

### Desktop Set 2 (2025-26)
- `SSBAS/Mo/2025-26/T02` - Monitor
- `SSBAS/Ko/2025-26/T02` - Keyboard
- `SSBAS/Ro/2025-26/T02` - Mouse
- `SSBAS/Co/2025-26/T02` - CPU

## Features

### Grouping Logic
- Assets are grouped by matching **Financial Year** and **Set ID** (TXX)
- Each set can have up to 4 components (Monitor, Keyboard, Mouse, CPU)
- Sets with missing components are still displayed with completeness indicators

### Display Features
- **Grouped View**: Shows desktop sets as cards with individual component details
- **Ungrouped View**: Traditional table view showing all assets individually
- **Toggle Button**: Switch between grouped and ungrouped views
- **Completeness Indicator**: Shows percentage of components present (0-100%)
- **Total Cost**: Sum of all component costs in the set
- **Location Display**: Common location if all components match, otherwise "Mixed Locations"

### CRUD Operations
- View individual component details
- Edit individual components
- Delete individual components
- All operations work seamlessly in both grouped and ungrouped views
