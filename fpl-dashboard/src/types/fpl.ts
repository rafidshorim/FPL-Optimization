// Raw FPL API response types — matches the public fantasy.premierleague.com API

export interface BootstrapStatic {
  events: GWEvent[];
  teams: Team[];
  elements: Player[];
  element_types: ElementType[];
  game_settings: GameSettings;
}

export interface GWEvent {
  id: number;
  name: string;
  deadline_time: string;
  finished: boolean;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
  average_entry_score: number;
  highest_score: number | null;
  most_captained: number | null;
  most_vice_captained: number | null;
  chip_plays: { chip_name: string; num_played: number }[];
  top_element: number | null;
  top_element_info: { id: number; points: number } | null;
  transfers_made: number;
}

export interface Team {
  id: number;
  code: number;
  name: string;
  short_name: string;
  strength: number;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
  played: number;
  win: number;
  draw: number;
  loss: number;
  points: number;
  position: number;
}

export interface ElementType {
  id: number; // 1=GKP 2=DEF 3=MID 4=FWD
  singular_name: string;
  singular_name_short: string;
  plural_name: string;
  plural_name_short: string;
  squad_select: number;
  squad_min_play: number;
  squad_max_play: number;
  ui_shirt_specific: boolean;
  sub_positions_locked: number[];
  element_count: number;
}

export interface Player {
  id: number;
  code: number;
  web_name: string;
  first_name: string;
  second_name: string;
  photo: string;
  team: number;
  team_code: number;
  element_type: number; // 1–4
  status: "a" | "u" | "d" | "i" | "s" | "n";
  now_cost: number; // divide by 10 for £m
  cost_change_event: number;
  cost_change_start: number;
  cost_change_event_fall: number;
  cost_change_start_fall: number;
  selected_by_percent: string;
  total_points: number;
  event_points: number;
  points_per_game: string;
  form: string;
  ep_this: string;
  ep_next: string;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  ict_index_rank: number;
  ict_index_rank_type: number;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
  expected_goals_per_90: number;
  expected_assists_per_90: number;
  expected_goal_involvements_per_90: number;
  expected_goals_conceded_per_90: number;
  starts: number;
  starts_per_90: number;
  clean_sheets_per_90: number;
  chance_of_playing_this_round: number | null;
  chance_of_playing_next_round: number | null;
  news: string;
  news_added: string | null;
  transfers_in: number;
  transfers_out: number;
  transfers_in_event: number;
  transfers_out_event: number;
  value_form: string;
  value_season: string;
  penalties_order: number | null;
  direct_freekicks_order: number | null;
  corners_and_indirect_freekicks_order: number | null;
  in_dreamteam: boolean;
  dreamteam_count: number;
  squad_number: number | null;
}

export interface Fixture {
  id: number;
  code: number;
  event: number | null;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  finished: boolean;
  finished_provisional: boolean;
  kickoff_time: string | null;
  minutes: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  started: boolean | null;
  pulse_id: number;
}

export interface PlayerSummary {
  fixtures: PlayerFixture[];
  history: PlayerHistory[];
  history_past: PlayerHistoryPast[];
}

export interface PlayerFixture {
  id: number;
  code: number;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  event: number;
  finished: boolean;
  minutes: number;
  kickoff_time: string;
  event_name: string;
  is_home: boolean;
  difficulty: number;
}

export interface PlayerHistory {
  element: number;
  fixture: number;
  opponent_team: number;
  total_points: number;
  was_home: boolean;
  kickoff_time: string;
  round: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  starts: number;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
  value: number;
  transfers_balance: number;
  selected: number;
  transfers_in: number;
  transfers_out: number;
}

export interface PlayerHistoryPast {
  season_name: string;
  element_code: number;
  start_cost: number;
  end_cost: number;
  total_points: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
}

export interface EntryResponse {
  id: number;
  name: string;
  player_first_name: string;
  player_last_name: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  summary_event_rank: number;
  current_event: number;
  last_deadline_bank: number; // divide by 10 for £m
  last_deadline_value: number; // divide by 10 for £m
  last_deadline_total_transfers: number;
  kit: string | null;
  leagues: {
    classic: ClassicLeague[];
    h2h: H2HLeague[];
    cup: unknown;
    cup_matches: unknown;
  };
  favourite_team: number | null;
  joined_time: string;
  started_event: number;
  extra_entry: unknown | null;
  years_active: number;
}

export interface ClassicLeague {
  id: number;
  name: string;
  entry_rank: number;
  entry_last_rank: number;
  rank_count: number;
  entry_percentile_rank: number;
  admin_entry: number | null;
  start_event: number;
  has_cup: boolean;
  cup_league: unknown | null;
  cup_qualified: unknown | null;
  max_entries: unknown | null;
  league_type: string;
  scoring: string;
}

export interface H2HLeague extends ClassicLeague {}

export interface PicksResponse {
  picks: Pick[];
  chips: { name: string; time: string; event: number }[];
  entry_history: EntryHistory;
  automatic_subs: AutomaticSub[];
}

export interface Pick {
  element: number; // player ID
  position: number; // 1–15 (1–11 starting, 12–15 bench)
  multiplier: number; // 1 normal, 2 captain
  is_captain: boolean;
  is_vice_captain: boolean;
  selling_price: number; // the actual sell price accounting for 50% profit rule
  purchase_price: number;
}

export interface EntryHistory {
  event: number;
  points: number;
  total_points: number;
  rank: number;
  rank_sort: number;
  overall_rank: number;
  bank: number; // divide by 10 for £m
  value: number; // divide by 10 for £m
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

export interface AutomaticSub {
  entry: number;
  element_in: number;
  element_out: number;
  event: number;
}

export interface TeamHistory {
  current: EntryHistory[];
  past: { season_name: string; total_points: number; rank: number }[];
  chips: { name: string; time: string; event: number }[];
}

export interface GameSettings {
  squad_squadsize: number; // 15
  squad_squadplay: number; // 11
  squad_team_limit: number; // 3
  squad_total_spend: number; // 1000 (£100m)
  transfers_cap: number;
  transfers_sell_on_fee: number; // 0.5
  ui_currency_multiplier: number; // 10
}
