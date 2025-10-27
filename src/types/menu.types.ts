/**
 * Menu configuration types for dynamic navigation from child apps
 */

export interface MenuItem {
  /** Unique identifier for the menu item */
  id: string;

  /** Display label for the menu item */
  label: string;

  /** Lucide React icon name (optional) */
  icon?: string;

  /** Path relative to the tool/app base path */
  path: string;

  /** Nested menu items for hierarchical navigation */
  children?: MenuItem[];
}

export interface MenuManifest {
  /** Menu configuration version for compatibility */
  version: string;

  /** Top-level menu items */
  items: MenuItem[];
}
