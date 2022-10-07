import { useState, useRef } from "react";
import { excludeNe, returnTernary } from "@/utils/commonFn";

export const usePlayInfoHooks = () => {
  //   const [infoValue, setInfoValues] = useState()

  const initialValue = {
    sport: "",
    play_type: "",
    detail_url: "",
    api_url: "",
    "home_team_name__en-US": "",
    "home_team_name__ko-KR": "",
    "home_team_nickname__en-US": "",
    "home_team_nickname__ko-KR": "",
    "away_team_name__en-US": "",
    "away_team_name__ko-KR": "",
    "away_team_nickname__en-US": "",
    "away_team_nickname__ko-KR": "",
    home_team_icon:
      "https://files-cms-4d-solution.4dreplay.io/test_common/team_image/",
    away_team_icon:
      "https://files-cms-4d-solution.4dreplay.io/test_common/team_image/",
    present_round: "",
    present_quarter: 0,
    home_team_score: 0,
    away_team_score: 0,
    extra_1_str: "000",
    etc: "{}",
  };

  // const playInfoDataRef = useRef({
  //   sport: '',
  //   play_type: '',
  //   detail_url: '',
  //   api_url: '',
  //   'home_team_name__en-US': '',
  //   'home_team_name__ko-KR': '',
  //   'home_team_nickname__en-US': '',
  //   'home_team_nickname__ko-KR': '',
  //   'away_team_name__en-US': '',
  //   'away_team_name__ko-KR': '',
  //   'away_team_nickname__en-US': '',
  //   'away_team_nickname__ko-KR': '',
  //   home_team_icon:
  //     'https://files-cms-4d-solution.4dreplay.io/test_common/team_image/',
  //   away_team_icon:
  //     'https://files-cms-4d-solution.4dreplay.io/test_common/team_image/',
  //   present_round: '',
  //   present_quarter: 0,
  //   home_team_score: 0,
  //   away_team_score: 0,
  //   extra_1_str: '000',
  //   etc: '{}',
  // });
  const [playInfoData, setPlayInfoDataRef] = useState(initialValue);

  const handleResetPlayInfoValues = () => {
    const values = {
      sport: "",
      play_type: "",
      detail_url: "",
      api_url: "",
      "home_team_name__en-US": "",
      "home_team_name__ko-KR": "",
      "home_team_nickname__en-US": "",
      "home_team_nickname__ko-KR": "",
      "away_team_name__en-US": "",
      "away_team_name__ko-KR": "",
      "away_team_nickname__en-US": "",
      "away_team_nickname__ko-KR": "",
      home_team_icon:
        "https://files-cms-4d-solution.4dreplay.io/test_common/team_image/",
      away_team_icon:
        "https://files-cms-4d-solution.4dreplay.io/test_common/team_image/",
      present_round: "",
      present_quarter: 0,
      home_team_score: 0,
      away_team_score: 0,
      extra_1_str: "000",
      etc: "{}",
    };

    setPlayInfoDataRef(values);
    // playInfoDataRef.current = values;
  };

  const handleSetPlayInfoValues = (values) => {
    if (!values) return;
    setPlayInfoDataRef(values);
    // playInfoDataRef.current = values;
  };

  const handleUpdatePlayInfoValues = (values, type: "saved" | "unSaved") => {
    if (!values) return;

    const data =
      type === "unSaved"
        ? {
            sport: values?.sport ? values?.sport.toString() : "",
            play_type: values?.play_type ? values?.play_type : "",
            detail_url: values?.detail_url ? values?.detail_url : "ne",
            api_url: values?.api_url ? values?.api_url : "",
            extra_1_str: values?.extra_1_str ? values?.extra_1_str : "000",
            etc: !values?.etc
              ? "{}"
              : typeof values.etc === "object"
              ? JSON.stringify(values.etc)
              : values.etc,
            // etc: JSON.stringify(values?.etc ? values?.etc : {}),
            "home_team_name__en-US": excludeNe(values["home_team_name__en-US"]),
            "home_team_name__ko-KR": excludeNe(values["home_team_name__ko-KR"]),
            "home_team_nickname__en-US": excludeNe(
              values["home_team_nickname__en-US"]
            ),
            "home_team_nickname__ko-KR": excludeNe(
              values["home_team_nickname__ko-KR"]
            ),
            "away_team_name__en-US": excludeNe(values["away_team_name__en-US"]),
            "away_team_name__ko-KR": excludeNe(values["away_team_name__ko-KR"]),
            "away_team_nickname__en-US": excludeNe(
              values["away_team_nickname__en-US"]
            ),
            "away_team_nickname__ko-KR": excludeNe(
              values["away_team_nickname__ko-KR"]
            ),

            home_team_icon: values?.home_team_icon
              ? values?.home_team_icon
              : "https://files-cms-4d-solution.4dreplay.io/test_common/team_image/",
            away_team_icon: values?.away_team_icon
              ? values?.away_team_icon
              : "https://files-cms-4d-solution.4dreplay.io/test_common/team_image/",
            present_round: values?.present_round ? values?.present_round : "",
            present_quarter: values?.present_quarter
              ? values?.present_quarter
              : 0,
            home_team_score: values?.home_team_score
              ? values?.home_team_score
              : 0,
            away_team_score: values?.away_team_score
              ? values?.away_team_score
              : 0,
          }
        : {
            sport: values?.sport ? values?.sport.toString() : "",
            play_type: values?.play_type ? values?.play_type : "",
            detail_url: values?.detail_url ? values?.detail_url : "ne",
            api_url: values?.api_url ? values?.api_url : "",
            extra_1_str: values?.extra_1_str ? values?.extra_1_str : "000",
            // etc: JSON.stringify(values?.etc ? values?.etc : {}),
            etc: !values?.etc
              ? "{}"
              : typeof values.etc === "object"
              ? JSON.stringify(values.etc)
              : values.etc,
            "home_team_name__en-US": returnTernary(values?.home?.name["en-US"]),
            "home_team_name__ko-KR": returnTernary(values?.home?.name["ko-KR"]),
            "home_team_nickname__en-US": returnTernary(
              values?.home?.nick_name["en-US"]
            ),
            "home_team_nickname__ko-KR": returnTernary(
              values?.home?.nick_name["ko-KR"]
            ),
            "away_team_name__en-US": returnTernary(values?.away?.name["en-US"]),
            "away_team_name__ko-KR": returnTernary(values?.away?.name["ko-KR"]),
            "away_team_nickname__en-US": returnTernary(
              values?.away?.nick_name["en-US"]
            ),
            "away_team_nickname__ko-KR": returnTernary(
              values?.away?.nick_name["ko-KR"]
            ),
            home_team_icon: values?.home?.icon
              ? values?.home?.icon
              : "https://files-cms-4d-solution.4dreplay.io/test_common/team_image/",
            away_team_icon: values?.away?.icon
              ? values?.away?.icon
              : "https://files-cms-4d-solution.4dreplay.io/test_common/team_image/",
            present_round: returnTernary(values?.present_round),
            present_quarter: values?.present_quarter
              ? values?.present_quarter
              : 0,
            home_team_score: values?.home?.score ? values?.home?.score : 0,
            away_team_score: values?.away?.score ? values?.away?.score : 0,
          };

    handleSetPlayInfoValues(data);
    setPlayInfoDataRef(data);
    return data;
    // return playInfoDataRef.current;
  };

  return {
    playInfoData,
    handleSetPlayInfoValues,
    handleResetPlayInfoValues,
    handleUpdatePlayInfoValues,
  };
};
