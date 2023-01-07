let trackNames = new Map<string, string>([
  // Blackwood
  ["BL1", "Blackwood GP"],
  ["BL1R", "Blackwood GP REV"],

  ["BL2", "Blackwood Historic"],
  ["BL2R", "Blackwood Historic REV"],

  ["BL3", "Blackwood Rallycross"],
  ["BL3R", "Blackwood Rallycross REV"],

  ["BL4", "Blackwood Car Park"],

  // South City
  ["SO1", "South City Classic"],
  ["SO1R", "South City Classic REV"],

  ["SO2", "South City Sprint 1"],
  ["SO2R", "South City Sprint 1 REV"],

  ["SO3", "South City Sprint 2"],
  ["SO3R", "South City Sprint 2 REV"],

  ["SO4", "South City Long"],
  ["SO4R", "South City Long REV"],

  ["SO5", "South City Town Course"],
  ["SO5R", "South City Town Course REV"],

  ["SO6", "South City Chicane Route"],
  ["SO6R", "South City Chicane Route REV"],

  // Fern Bay
  ["FE1", "Fern Bay Club"],
  ["FE1R", "Fern Bay Club"],

  ["FE2", "Fern Bay Green"],
  ["FE2R", "Fern Bay Green REV"],

  ["FE3", "Fern Bay Gold"],
  ["FE3R", "Fern Bay Gold REV"],

  ["FE4", "Fern Bay Black"],
  ["FE4R", "Fern Bay Black REV"],

  ["FE5", "Fern Bay Rallycross"],
  ["FE5R", "Fern Bay Rallycross REV"],

  ["FE6", "Fern Bay Rallycross Green"],
  ["FE6R", "Fern Bay Rallycross Green REV"],

  // Autocross
  ["AU1", "Autocross"],
  ["AU2", "Autocross Skid Pad"],
  ["AU3", "Autocross Drag Strip"],
  ["AU4", "Autocross 8 Lane Drag"],

  // Kyoto Ring
  ["KY1", "Kyoto Ring Oval"],
  ["KY1R", "Kyoto Ring Oval REV"],

  ["KY2", "Kyoto Ring National"],
  ["KY2R", "Kyoto Ring National REV"],

  ["KY3", "Kyoto Ring GP Long"],
  ["KY3R", "Kyoto Ring GP Long REV"],

  // Westhill
  ["WE1", "Westhill National"],
  ["WE1R", "Westhill National REV"],

  ["WE2", "Westhill International"],
  ["WE2R", "Westhill International REV"],

  ["WE3", "Westhill Car Park"],

  ["WE4", "Westhill Karting"],
  ["WE4R", "Westhill Karting REV"],

  ["WE5", "Westhill Karting National"],
  ["WE5R", "Westhill Karting National REV"],

  // Aston
  ["AS1", "Aston Cadet"],
  ["AS1R", "Aston Cadet REV"],

  ["AS2", "Aston Club"],
  ["AS2R", "Aston Club REV"],

  ["AS3", "Aston National"],
  ["AS3R", "Aston National REV"],

  ["AS4", "Aston Historic"],
  ["AS4R", "Aston Historic REV"],

  ["AS5", "Aston Grand Prix"],
  ["AS5R", "Aston Grand Prix REV"],

  ["AS6", "Aston Grand Touring"],
  ["AS6R", "Aston Grand Touring REV"],

  ["AS7", "Aston North"],
  ["AS7R", "Aston North REV"],

  // Rockingham
  ["RO1", "Rockingham ISSC"],
  ["RO2", "Rockingham National"],
  ["RO3", "Rockingham Oval"],
  ["RO4", "Rockingham ISSC Long"],
  ["RO5", "Rockingham Lake"],
  ["RO6", "Rockingham Handling"],
  ["RO7", "Rockingham International"],
  ["RO8", "Rockingham Historic"],
  ["RO9", "Rockingham Historic Short"],
  ["RO10", "Rockingham International Long"],
  ["RO11", "Rockingham Sportscar"],
]);

export function getTrackName(code: string): string {
  return trackNames.get(code) ?? code;
}
