import { Series } from "remotion";
import { NEWCOMB_DURATIONS } from "../../../core-logic/newcomb-constants";
import { Scene01_Hook } from "./Scene01_Hook";
import { Scene02_TwoBoxArgument } from "./Scene02_TwoBoxArgument";
import { Scene03_OneBoxArgument } from "./Scene03_OneBoxArgument";
import { Scene04_InvisibleGraph } from "./Scene04_InvisibleGraph";
import { Scene05_GPChemist } from "./Scene05_GPChemist";
import { Scene06_CancerCure } from "./Scene06_CancerCure";
import { Scene07_TimeTraversal } from "./Scene07_TimeTraversal";
import { Scene08_EndCard } from "./Scene08_EndCard";

export function NewcombParadox() {
  return (
    <Series>
      <Series.Sequence durationInFrames={NEWCOMB_DURATIONS.hook}>
        <Scene01_Hook />
      </Series.Sequence>
      <Series.Sequence durationInFrames={NEWCOMB_DURATIONS.twoBoxArgument}>
        <Scene02_TwoBoxArgument />
      </Series.Sequence>
      <Series.Sequence durationInFrames={NEWCOMB_DURATIONS.oneBoxArgument}>
        <Scene03_OneBoxArgument />
      </Series.Sequence>
      <Series.Sequence durationInFrames={NEWCOMB_DURATIONS.invisibleGraph}>
        <Scene04_InvisibleGraph />
      </Series.Sequence>
      <Series.Sequence durationInFrames={NEWCOMB_DURATIONS.gpChemist}>
        <Scene05_GPChemist />
      </Series.Sequence>
      <Series.Sequence durationInFrames={NEWCOMB_DURATIONS.cancerCure}>
        <Scene06_CancerCure />
      </Series.Sequence>
      <Series.Sequence durationInFrames={NEWCOMB_DURATIONS.timeTraversal}>
        <Scene07_TimeTraversal />
      </Series.Sequence>
      <Series.Sequence durationInFrames={NEWCOMB_DURATIONS.endCard}>
        <Scene08_EndCard />
      </Series.Sequence>
    </Series>
  );
}
