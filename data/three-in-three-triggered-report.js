window.__THREE_IN_THREE_TRIGGERED_REPORT__ = {
  "generatedAt": "2026-07-18T13:53:16.226Z",
  "source": "am",
  "sourceName": "澳门",
  "rule": "触发式6码复式：只在走势条件满足时出手；触发期正码前6命中>=3算中；非触发期空过。",
  "totalRecords": 2248,
  "rules": [
    {
      "id": "carryHot10:prevZone<=2",
      "formula": "上期延续+近10期热度6码",
      "trigger": "上期区间数<=2",
      "triggerId": "prevZone<=2",
      "poolSize": 6,
      "evaluatedDraws": 2238,
      "triggeredDraws": 46,
      "skippedDraws": 2192,
      "hits": 2,
      "hitRate": 4.35,
      "coverageRate": 2.06,
      "maxTriggeredMissStreak": 22,
      "byYear": {
        "2020": {
          "evaluatedDraws": 216,
          "triggeredDraws": 5,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 2.31,
          "maxTriggeredMissStreak": 5
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 4,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 1.1,
          "maxTriggeredMissStreak": 4
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 4,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 1.1,
          "maxTriggeredMissStreak": 4
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 9,
          "hits": 1,
          "hitRate": 11.11,
          "coverageRate": 2.47,
          "maxTriggeredMissStreak": 4
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 13,
          "hits": 1,
          "hitRate": 7.69,
          "coverageRate": 3.55,
          "maxTriggeredMissStreak": 11
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 9,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 2.49,
          "maxTriggeredMissStreak": 9
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 2,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 1.01,
          "maxTriggeredMissStreak": 2
        }
      },
      "latestPool": [
        "12",
        "21",
        "24",
        "35",
        "45",
        "48"
      ],
      "latestTriggered": {
        "issue": 127,
        "date": "2026-05-07",
        "year": "2026",
        "pool": [
          "01",
          "03",
          "05",
          "09",
          "10",
          "15"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 6,
          "zoneCount": 2,
          "oddCount": 5
        },
        "triggerState": {
          "missStreak": 7,
          "previousShape": {
            "smallCount": 6,
            "zoneCount": 2,
            "oddCount": 5
          }
        }
      }
    },
    {
      "id": "carryHot10:prevSmall>=5-or-prevZone<=2",
      "formula": "上期延续+近10期热度6码",
      "trigger": "上期小号>=5 或 上期区间数<=2",
      "triggerId": "prevSmall>=5-or-prevZone<=2",
      "poolSize": 6,
      "evaluatedDraws": 2238,
      "triggeredDraws": 210,
      "skippedDraws": 2028,
      "hits": 9,
      "hitRate": 4.29,
      "coverageRate": 9.38,
      "maxTriggeredMissStreak": 49,
      "byYear": {
        "2020": {
          "evaluatedDraws": 216,
          "triggeredDraws": 17,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 7.87,
          "maxTriggeredMissStreak": 17
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 27,
          "hits": 1,
          "hitRate": 3.7,
          "coverageRate": 7.4,
          "maxTriggeredMissStreak": 22
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 37,
          "hits": 2,
          "hitRate": 5.41,
          "coverageRate": 10.14,
          "maxTriggeredMissStreak": 23
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 32,
          "hits": 3,
          "hitRate": 9.38,
          "coverageRate": 8.77,
          "maxTriggeredMissStreak": 16
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 41,
          "hits": 2,
          "hitRate": 4.88,
          "coverageRate": 11.2,
          "maxTriggeredMissStreak": 25
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 37,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 10.22,
          "maxTriggeredMissStreak": 37
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 19,
          "hits": 1,
          "hitRate": 5.26,
          "coverageRate": 9.55,
          "maxTriggeredMissStreak": 16
        }
      },
      "latestPool": [
        "12",
        "21",
        "24",
        "35",
        "45",
        "48"
      ],
      "latestTriggered": {
        "issue": 189,
        "date": "2026-07-08",
        "year": "2026",
        "pool": [
          "01",
          "05",
          "10",
          "14",
          "19",
          "38"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 5,
          "zoneCount": 3,
          "oddCount": 3
        },
        "triggerState": {
          "missStreak": 25,
          "previousShape": {
            "smallCount": 5,
            "zoneCount": 3,
            "oddCount": 3
          }
        }
      }
    },
    {
      "id": "carryHot10:prevSmall>=5",
      "formula": "上期延续+近10期热度6码",
      "trigger": "上期小号>=5",
      "triggerId": "prevSmall>=5",
      "poolSize": 6,
      "evaluatedDraws": 2238,
      "triggeredDraws": 180,
      "skippedDraws": 2058,
      "hits": 7,
      "hitRate": 3.89,
      "coverageRate": 8.04,
      "maxTriggeredMissStreak": 41,
      "byYear": {
        "2020": {
          "evaluatedDraws": 216,
          "triggeredDraws": 13,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 6.02,
          "maxTriggeredMissStreak": 13
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 25,
          "hits": 1,
          "hitRate": 4,
          "coverageRate": 6.85,
          "maxTriggeredMissStreak": 20
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 34,
          "hits": 2,
          "hitRate": 5.88,
          "coverageRate": 9.32,
          "maxTriggeredMissStreak": 22
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 25,
          "hits": 2,
          "hitRate": 8,
          "coverageRate": 6.85,
          "maxTriggeredMissStreak": 14
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 35,
          "hits": 1,
          "hitRate": 2.86,
          "coverageRate": 9.56,
          "maxTriggeredMissStreak": 25
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 30,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 8.29,
          "maxTriggeredMissStreak": 30
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 18,
          "hits": 1,
          "hitRate": 5.56,
          "coverageRate": 9.05,
          "maxTriggeredMissStreak": 15
        }
      },
      "latestPool": [
        "12",
        "21",
        "24",
        "35",
        "45",
        "48"
      ],
      "latestTriggered": {
        "issue": 189,
        "date": "2026-07-08",
        "year": "2026",
        "pool": [
          "01",
          "05",
          "10",
          "14",
          "19",
          "38"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 5,
          "zoneCount": 3,
          "oddCount": 3
        },
        "triggerState": {
          "missStreak": 25,
          "previousShape": {
            "smallCount": 5,
            "zoneCount": 3,
            "oddCount": 3
          }
        }
      }
    },
    {
      "id": "hot5:miss>=30",
      "formula": "近5期热码前6",
      "trigger": "连挂>=30",
      "triggerId": "miss>=30",
      "poolSize": 6,
      "evaluatedDraws": 2243,
      "triggeredDraws": 1043,
      "skippedDraws": 1200,
      "hits": 27,
      "hitRate": 2.59,
      "coverageRate": 46.5,
      "maxTriggeredMissStreak": 111,
      "byYear": {
        "2020": {
          "evaluatedDraws": 221,
          "triggeredDraws": 112,
          "hits": 1,
          "hitRate": 0.89,
          "coverageRate": 50.68,
          "maxTriggeredMissStreak": 111
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 204,
          "hits": 4,
          "hitRate": 1.96,
          "coverageRate": 55.89,
          "maxTriggeredMissStreak": 105
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 116,
          "hits": 6,
          "hitRate": 5.17,
          "coverageRate": 31.78,
          "maxTriggeredMissStreak": 28
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 153,
          "hits": 7,
          "hitRate": 4.58,
          "coverageRate": 41.92,
          "maxTriggeredMissStreak": 48
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 178,
          "hits": 4,
          "hitRate": 2.25,
          "coverageRate": 48.63,
          "maxTriggeredMissStreak": 86
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 153,
          "hits": 3,
          "hitRate": 1.96,
          "coverageRate": 42.27,
          "maxTriggeredMissStreak": 66
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 127,
          "hits": 2,
          "hitRate": 1.57,
          "coverageRate": 63.82,
          "maxTriggeredMissStreak": 67
        }
      },
      "latestPool": [
        "04",
        "19",
        "21",
        "24",
        "30",
        "48"
      ],
      "latestTriggered": {
        "issue": 199,
        "date": "2026-07-18",
        "year": "2026",
        "pool": [
          "04",
          "19",
          "21",
          "24",
          "30",
          "48"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 3,
          "zoneCount": 4,
          "oddCount": 3
        },
        "triggerState": {
          "missStreak": 76,
          "previousShape": {
            "smallCount": 3,
            "zoneCount": 4,
            "oddCount": 3
          }
        }
      }
    },
    {
      "id": "hot5:prevOdd>=5",
      "formula": "近5期热码前6",
      "trigger": "上期单数>=5",
      "triggerId": "prevOdd>=5",
      "poolSize": 6,
      "evaluatedDraws": 2243,
      "triggeredDraws": 234,
      "skippedDraws": 2009,
      "hits": 6,
      "hitRate": 2.56,
      "coverageRate": 10.43,
      "maxTriggeredMissStreak": 120,
      "byYear": {
        "2020": {
          "evaluatedDraws": 221,
          "triggeredDraws": 22,
          "hits": 1,
          "hitRate": 4.55,
          "coverageRate": 9.95,
          "maxTriggeredMissStreak": 13
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 36,
          "hits": 1,
          "hitRate": 2.78,
          "coverageRate": 9.86,
          "maxTriggeredMissStreak": 30
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 32,
          "hits": 1,
          "hitRate": 3.13,
          "coverageRate": 8.77,
          "maxTriggeredMissStreak": 27
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 39,
          "hits": 3,
          "hitRate": 7.69,
          "coverageRate": 10.68,
          "maxTriggeredMissStreak": 18
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 50,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 13.66,
          "maxTriggeredMissStreak": 50
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 41,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 11.33,
          "maxTriggeredMissStreak": 41
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 14,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 7.04,
          "maxTriggeredMissStreak": 14
        }
      },
      "latestPool": [
        "04",
        "19",
        "21",
        "24",
        "30",
        "48"
      ],
      "latestTriggered": {
        "issue": 194,
        "date": "2026-07-13",
        "year": "2026",
        "pool": [
          "02",
          "19",
          "29",
          "37",
          "43",
          "45"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 2,
          "zoneCount": 4,
          "oddCount": 5
        },
        "triggerState": {
          "missStreak": 71,
          "previousShape": {
            "smallCount": 2,
            "zoneCount": 4,
            "oddCount": 5
          }
        }
      }
    },
    {
      "id": "carryHot10:miss>=20-or-prevSmall>=5",
      "formula": "上期延续+近10期热度6码",
      "trigger": "连挂>=20 或 上期小号>=5",
      "triggerId": "miss>=20-or-prevSmall>=5",
      "poolSize": 6,
      "evaluatedDraws": 2238,
      "triggeredDraws": 1415,
      "skippedDraws": 823,
      "hits": 36,
      "hitRate": 2.54,
      "coverageRate": 63.23,
      "maxTriggeredMissStreak": 142,
      "byYear": {
        "2020": {
          "evaluatedDraws": 216,
          "triggeredDraws": 99,
          "hits": 5,
          "hitRate": 5.05,
          "coverageRate": 45.83,
          "maxTriggeredMissStreak": 40
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 273,
          "hits": 5,
          "hitRate": 1.83,
          "coverageRate": 74.79,
          "maxTriggeredMissStreak": 131
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 284,
          "hits": 5,
          "hitRate": 1.76,
          "coverageRate": 77.81,
          "maxTriggeredMissStreak": 73
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 200,
          "hits": 6,
          "hitRate": 3,
          "coverageRate": 54.79,
          "maxTriggeredMissStreak": 141
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 188,
          "hits": 7,
          "hitRate": 3.72,
          "coverageRate": 51.37,
          "maxTriggeredMissStreak": 74
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 239,
          "hits": 5,
          "hitRate": 2.09,
          "coverageRate": 66.02,
          "maxTriggeredMissStreak": 70
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 132,
          "hits": 3,
          "hitRate": 2.27,
          "coverageRate": 66.33,
          "maxTriggeredMissStreak": 54
        }
      },
      "latestPool": [
        "12",
        "21",
        "24",
        "35",
        "45",
        "48"
      ],
      "latestTriggered": {
        "issue": 199,
        "date": "2026-07-18",
        "year": "2026",
        "pool": [
          "12",
          "21",
          "24",
          "35",
          "45",
          "48"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 3,
          "zoneCount": 4,
          "oddCount": 3
        },
        "triggerState": {
          "missStreak": 35,
          "previousShape": {
            "smallCount": 3,
            "zoneCount": 4,
            "oddCount": 3
          }
        }
      }
    },
    {
      "id": "hot5:miss>=20",
      "formula": "近5期热码前6",
      "trigger": "连挂>=20",
      "triggerId": "miss>=20",
      "poolSize": 6,
      "evaluatedDraws": 2243,
      "triggeredDraws": 1365,
      "skippedDraws": 878,
      "hits": 34,
      "hitRate": 2.49,
      "coverageRate": 60.86,
      "maxTriggeredMissStreak": 121,
      "byYear": {
        "2020": {
          "evaluatedDraws": 221,
          "triggeredDraws": 139,
          "hits": 2,
          "hitRate": 1.44,
          "coverageRate": 62.9,
          "maxTriggeredMissStreak": 121
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 247,
          "hits": 5,
          "hitRate": 2.02,
          "coverageRate": 67.67,
          "maxTriggeredMissStreak": 115
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 192,
          "hits": 7,
          "hitRate": 3.65,
          "coverageRate": 52.6,
          "maxTriggeredMissStreak": 38
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 216,
          "hits": 7,
          "hitRate": 3.24,
          "coverageRate": 59.18,
          "maxTriggeredMissStreak": 58
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 216,
          "hits": 5,
          "hitRate": 2.31,
          "coverageRate": 59.02,
          "maxTriggeredMissStreak": 96
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 208,
          "hits": 6,
          "hitRate": 2.88,
          "coverageRate": 57.46,
          "maxTriggeredMissStreak": 76
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 147,
          "hits": 2,
          "hitRate": 1.36,
          "coverageRate": 73.87,
          "maxTriggeredMissStreak": 67
        }
      },
      "latestPool": [
        "04",
        "19",
        "21",
        "24",
        "30",
        "48"
      ],
      "latestTriggered": {
        "issue": 199,
        "date": "2026-07-18",
        "year": "2026",
        "pool": [
          "04",
          "19",
          "21",
          "24",
          "30",
          "48"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 3,
          "zoneCount": 4,
          "oddCount": 3
        },
        "triggerState": {
          "missStreak": 76,
          "previousShape": {
            "smallCount": 3,
            "zoneCount": 4,
            "oddCount": 3
          }
        }
      }
    },
    {
      "id": "carryHot10:miss>=30",
      "formula": "上期延续+近10期热度6码",
      "trigger": "连挂>=30",
      "triggerId": "miss>=30",
      "poolSize": 6,
      "evaluatedDraws": 2238,
      "triggeredDraws": 1047,
      "skippedDraws": 1191,
      "hits": 26,
      "hitRate": 2.48,
      "coverageRate": 46.78,
      "maxTriggeredMissStreak": 127,
      "byYear": {
        "2020": {
          "evaluatedDraws": 216,
          "triggeredDraws": 51,
          "hits": 2,
          "hitRate": 3.92,
          "coverageRate": 23.61,
          "maxTriggeredMissStreak": 27
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 226,
          "hits": 4,
          "hitRate": 1.77,
          "coverageRate": 61.92,
          "maxTriggeredMissStreak": 120
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 230,
          "hits": 5,
          "hitRate": 2.17,
          "coverageRate": 63.01,
          "maxTriggeredMissStreak": 61
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 153,
          "hits": 3,
          "hitRate": 1.96,
          "coverageRate": 41.92,
          "maxTriggeredMissStreak": 127
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 105,
          "hits": 5,
          "hitRate": 4.76,
          "coverageRate": 28.69,
          "maxTriggeredMissStreak": 64
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 189,
          "hits": 4,
          "hitRate": 2.12,
          "coverageRate": 52.21,
          "maxTriggeredMissStreak": 59
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 93,
          "hits": 3,
          "hitRate": 3.23,
          "coverageRate": 46.73,
          "maxTriggeredMissStreak": 42
        }
      },
      "latestPool": [
        "12",
        "21",
        "24",
        "35",
        "45",
        "48"
      ],
      "latestTriggered": {
        "issue": 199,
        "date": "2026-07-18",
        "year": "2026",
        "pool": [
          "12",
          "21",
          "24",
          "35",
          "45",
          "48"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 3,
          "zoneCount": 4,
          "oddCount": 3
        },
        "triggerState": {
          "missStreak": 35,
          "previousShape": {
            "smallCount": 3,
            "zoneCount": 4,
            "oddCount": 3
          }
        }
      }
    },
    {
      "id": "hot5:miss>=20-or-prevSmall>=5",
      "formula": "近5期热码前6",
      "trigger": "连挂>=20 或 上期小号>=5",
      "triggerId": "miss>=20-or-prevSmall>=5",
      "poolSize": 6,
      "evaluatedDraws": 2243,
      "triggeredDraws": 1441,
      "skippedDraws": 802,
      "hits": 35,
      "hitRate": 2.43,
      "coverageRate": 64.24,
      "maxTriggeredMissStreak": 122,
      "byYear": {
        "2020": {
          "evaluatedDraws": 221,
          "triggeredDraws": 142,
          "hits": 2,
          "hitRate": 1.41,
          "coverageRate": 64.25,
          "maxTriggeredMissStreak": 122
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 258,
          "hits": 5,
          "hitRate": 1.94,
          "coverageRate": 70.68,
          "maxTriggeredMissStreak": 116
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 208,
          "hits": 8,
          "hitRate": 3.85,
          "coverageRate": 56.99,
          "maxTriggeredMissStreak": 38
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 226,
          "hits": 7,
          "hitRate": 3.1,
          "coverageRate": 61.92,
          "maxTriggeredMissStreak": 58
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 229,
          "hits": 5,
          "hitRate": 2.18,
          "coverageRate": 62.57,
          "maxTriggeredMissStreak": 97
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 223,
          "hits": 6,
          "hitRate": 2.69,
          "coverageRate": 61.6,
          "maxTriggeredMissStreak": 77
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 155,
          "hits": 2,
          "hitRate": 1.29,
          "coverageRate": 77.89,
          "maxTriggeredMissStreak": 67
        }
      },
      "latestPool": [
        "04",
        "19",
        "21",
        "24",
        "30",
        "48"
      ],
      "latestTriggered": {
        "issue": 199,
        "date": "2026-07-18",
        "year": "2026",
        "pool": [
          "04",
          "19",
          "21",
          "24",
          "30",
          "48"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 3,
          "zoneCount": 4,
          "oddCount": 3
        },
        "triggerState": {
          "missStreak": 76,
          "previousShape": {
            "smallCount": 3,
            "zoneCount": 4,
            "oddCount": 3
          }
        }
      }
    },
    {
      "id": "carryHot10:miss>=20",
      "formula": "上期延续+近10期热度6码",
      "trigger": "连挂>=20",
      "triggerId": "miss>=20",
      "poolSize": 6,
      "evaluatedDraws": 2238,
      "triggeredDraws": 1338,
      "skippedDraws": 900,
      "hits": 32,
      "hitRate": 2.39,
      "coverageRate": 59.79,
      "maxTriggeredMissStreak": 137,
      "byYear": {
        "2020": {
          "evaluatedDraws": 216,
          "triggeredDraws": 91,
          "hits": 5,
          "hitRate": 5.49,
          "coverageRate": 42.13,
          "maxTriggeredMissStreak": 37
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 269,
          "hits": 4,
          "hitRate": 1.49,
          "coverageRate": 73.7,
          "maxTriggeredMissStreak": 130
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 270,
          "hits": 5,
          "hitRate": 1.85,
          "coverageRate": 73.97,
          "maxTriggeredMissStreak": 71
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 185,
          "hits": 4,
          "hitRate": 2.16,
          "coverageRate": 50.68,
          "maxTriggeredMissStreak": 137
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 170,
          "hits": 6,
          "hitRate": 3.53,
          "coverageRate": 46.45,
          "maxTriggeredMissStreak": 74
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 230,
          "hits": 5,
          "hitRate": 2.17,
          "coverageRate": 63.54,
          "maxTriggeredMissStreak": 69
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 123,
          "hits": 3,
          "hitRate": 2.44,
          "coverageRate": 61.81,
          "maxTriggeredMissStreak": 52
        }
      },
      "latestPool": [
        "12",
        "21",
        "24",
        "35",
        "45",
        "48"
      ],
      "latestTriggered": {
        "issue": 199,
        "date": "2026-07-18",
        "year": "2026",
        "pool": [
          "12",
          "21",
          "24",
          "35",
          "45",
          "48"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 3,
          "zoneCount": 4,
          "oddCount": 3
        },
        "triggerState": {
          "missStreak": 35,
          "previousShape": {
            "smallCount": 3,
            "zoneCount": 4,
            "oddCount": 3
          }
        }
      }
    },
    {
      "id": "hot10:miss>=20",
      "formula": "近10期热码前6",
      "trigger": "连挂>=20",
      "triggerId": "miss>=20",
      "poolSize": 6,
      "evaluatedDraws": 2238,
      "triggeredDraws": 1441,
      "skippedDraws": 797,
      "hits": 33,
      "hitRate": 2.29,
      "coverageRate": 64.39,
      "maxTriggeredMissStreak": 163,
      "byYear": {
        "2020": {
          "evaluatedDraws": 216,
          "triggeredDraws": 96,
          "hits": 5,
          "hitRate": 5.21,
          "coverageRate": 44.44,
          "maxTriggeredMissStreak": 38
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 216,
          "hits": 7,
          "hitRate": 3.24,
          "coverageRate": 59.18,
          "maxTriggeredMissStreak": 85
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 224,
          "hits": 5,
          "hitRate": 2.23,
          "coverageRate": 61.37,
          "maxTriggeredMissStreak": 78
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 228,
          "hits": 6,
          "hitRate": 2.63,
          "coverageRate": 62.47,
          "maxTriggeredMissStreak": 70
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 238,
          "hits": 5,
          "hitRate": 2.1,
          "coverageRate": 65.03,
          "maxTriggeredMissStreak": 96
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 267,
          "hits": 4,
          "hitRate": 1.5,
          "coverageRate": 73.76,
          "maxTriggeredMissStreak": 134
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 172,
          "hits": 1,
          "hitRate": 0.58,
          "coverageRate": 86.43,
          "maxTriggeredMissStreak": 127
        }
      },
      "latestPool": [
        "19",
        "24",
        "30",
        "37",
        "45",
        "48"
      ],
      "latestTriggered": {
        "issue": 199,
        "date": "2026-07-18",
        "year": "2026",
        "pool": [
          "19",
          "24",
          "30",
          "37",
          "45",
          "48"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 3,
          "zoneCount": 4,
          "oddCount": 3
        },
        "triggerState": {
          "missStreak": 146,
          "previousShape": {
            "smallCount": 3,
            "zoneCount": 4,
            "oddCount": 3
          }
        }
      }
    },
    {
      "id": "hot10:miss>=20-or-prevSmall>=5",
      "formula": "近10期热码前6",
      "trigger": "连挂>=20 或 上期小号>=5",
      "triggerId": "miss>=20-or-prevSmall>=5",
      "poolSize": 6,
      "evaluatedDraws": 2238,
      "triggeredDraws": 1492,
      "skippedDraws": 746,
      "hits": 33,
      "hitRate": 2.21,
      "coverageRate": 66.67,
      "maxTriggeredMissStreak": 163,
      "byYear": {
        "2020": {
          "evaluatedDraws": 216,
          "triggeredDraws": 102,
          "hits": 5,
          "hitRate": 4.9,
          "coverageRate": 47.22,
          "maxTriggeredMissStreak": 39
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 226,
          "hits": 7,
          "hitRate": 3.1,
          "coverageRate": 61.92,
          "maxTriggeredMissStreak": 85
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 238,
          "hits": 5,
          "hitRate": 2.1,
          "coverageRate": 65.21,
          "maxTriggeredMissStreak": 78
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 235,
          "hits": 6,
          "hitRate": 2.55,
          "coverageRate": 64.38,
          "maxTriggeredMissStreak": 72
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 246,
          "hits": 5,
          "hitRate": 2.03,
          "coverageRate": 67.21,
          "maxTriggeredMissStreak": 97
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 273,
          "hits": 4,
          "hitRate": 1.47,
          "coverageRate": 75.41,
          "maxTriggeredMissStreak": 134
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 172,
          "hits": 1,
          "hitRate": 0.58,
          "coverageRate": 86.43,
          "maxTriggeredMissStreak": 127
        }
      },
      "latestPool": [
        "19",
        "24",
        "30",
        "37",
        "45",
        "48"
      ],
      "latestTriggered": {
        "issue": 199,
        "date": "2026-07-18",
        "year": "2026",
        "pool": [
          "19",
          "24",
          "30",
          "37",
          "45",
          "48"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 3,
          "zoneCount": 4,
          "oddCount": 3
        },
        "triggerState": {
          "missStreak": 146,
          "previousShape": {
            "smallCount": 3,
            "zoneCount": 4,
            "oddCount": 3
          }
        }
      }
    },
    {
      "id": "carryHot10:prevOdd>=5",
      "formula": "上期延续+近10期热度6码",
      "trigger": "上期单数>=5",
      "triggerId": "prevOdd>=5",
      "poolSize": 6,
      "evaluatedDraws": 2238,
      "triggeredDraws": 234,
      "skippedDraws": 2004,
      "hits": 5,
      "hitRate": 2.14,
      "coverageRate": 10.46,
      "maxTriggeredMissStreak": 66,
      "byYear": {
        "2020": {
          "evaluatedDraws": 216,
          "triggeredDraws": 22,
          "hits": 1,
          "hitRate": 4.55,
          "coverageRate": 10.19,
          "maxTriggeredMissStreak": 13
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 36,
          "hits": 1,
          "hitRate": 2.78,
          "coverageRate": 9.86,
          "maxTriggeredMissStreak": 29
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 32,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 8.77,
          "maxTriggeredMissStreak": 32
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 39,
          "hits": 2,
          "hitRate": 5.13,
          "coverageRate": 10.68,
          "maxTriggeredMissStreak": 22
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 50,
          "hits": 1,
          "hitRate": 2,
          "coverageRate": 13.66,
          "maxTriggeredMissStreak": 38
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 41,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 11.33,
          "maxTriggeredMissStreak": 41
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 14,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 7.04,
          "maxTriggeredMissStreak": 14
        }
      },
      "latestPool": [
        "12",
        "21",
        "24",
        "35",
        "45",
        "48"
      ],
      "latestTriggered": {
        "issue": 194,
        "date": "2026-07-13",
        "year": "2026",
        "pool": [
          "02",
          "11",
          "25",
          "29",
          "45",
          "49"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 2,
          "zoneCount": 4,
          "oddCount": 5
        },
        "triggerState": {
          "missStreak": 30,
          "previousShape": {
            "smallCount": 2,
            "zoneCount": 4,
            "oddCount": 5
          }
        }
      }
    },
    {
      "id": "hot10:prevOdd>=5",
      "formula": "近10期热码前6",
      "trigger": "上期单数>=5",
      "triggerId": "prevOdd>=5",
      "poolSize": 6,
      "evaluatedDraws": 2238,
      "triggeredDraws": 234,
      "skippedDraws": 2004,
      "hits": 5,
      "hitRate": 2.14,
      "coverageRate": 10.46,
      "maxTriggeredMissStreak": 119,
      "byYear": {
        "2020": {
          "evaluatedDraws": 216,
          "triggeredDraws": 22,
          "hits": 1,
          "hitRate": 4.55,
          "coverageRate": 10.19,
          "maxTriggeredMissStreak": 13
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 36,
          "hits": 1,
          "hitRate": 2.78,
          "coverageRate": 9.86,
          "maxTriggeredMissStreak": 31
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 32,
          "hits": 1,
          "hitRate": 3.13,
          "coverageRate": 8.77,
          "maxTriggeredMissStreak": 20
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 39,
          "hits": 2,
          "hitRate": 5.13,
          "coverageRate": 10.68,
          "maxTriggeredMissStreak": 23
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 50,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 13.66,
          "maxTriggeredMissStreak": 50
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 41,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 11.33,
          "maxTriggeredMissStreak": 41
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 14,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 7.04,
          "maxTriggeredMissStreak": 14
        }
      },
      "latestPool": [
        "19",
        "24",
        "30",
        "37",
        "45",
        "48"
      ],
      "latestTriggered": {
        "issue": 194,
        "date": "2026-07-13",
        "year": "2026",
        "pool": [
          "01",
          "19",
          "29",
          "37",
          "38",
          "45"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 2,
          "zoneCount": 4,
          "oddCount": 5
        },
        "triggerState": {
          "missStreak": 141,
          "previousShape": {
            "smallCount": 2,
            "zoneCount": 4,
            "oddCount": 5
          }
        }
      }
    },
    {
      "id": "hot10:miss>=30",
      "formula": "近10期热码前6",
      "trigger": "连挂>=30",
      "triggerId": "miss>=30",
      "poolSize": 6,
      "evaluatedDraws": 2238,
      "triggeredDraws": 1148,
      "skippedDraws": 1090,
      "hits": 23,
      "hitRate": 2,
      "coverageRate": 51.3,
      "maxTriggeredMissStreak": 153,
      "byYear": {
        "2020": {
          "evaluatedDraws": 216,
          "triggeredDraws": 55,
          "hits": 2,
          "hitRate": 3.64,
          "coverageRate": 25.46,
          "maxTriggeredMissStreak": 28
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 156,
          "hits": 4,
          "hitRate": 2.56,
          "coverageRate": 42.74,
          "maxTriggeredMissStreak": 75
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 181,
          "hits": 3,
          "hitRate": 1.66,
          "coverageRate": 49.59,
          "maxTriggeredMissStreak": 78
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 177,
          "hits": 5,
          "hitRate": 2.82,
          "coverageRate": 48.49,
          "maxTriggeredMissStreak": 60
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 181,
          "hits": 5,
          "hitRate": 2.76,
          "coverageRate": 49.45,
          "maxTriggeredMissStreak": 86
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 236,
          "hits": 3,
          "hitRate": 1.27,
          "coverageRate": 65.19,
          "maxTriggeredMissStreak": 124
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 162,
          "hits": 1,
          "hitRate": 0.62,
          "coverageRate": 81.41,
          "maxTriggeredMissStreak": 117
        }
      },
      "latestPool": [
        "19",
        "24",
        "30",
        "37",
        "45",
        "48"
      ],
      "latestTriggered": {
        "issue": 199,
        "date": "2026-07-18",
        "year": "2026",
        "pool": [
          "19",
          "24",
          "30",
          "37",
          "45",
          "48"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 3,
          "zoneCount": 4,
          "oddCount": 3
        },
        "triggerState": {
          "missStreak": 146,
          "previousShape": {
            "smallCount": 3,
            "zoneCount": 4,
            "oddCount": 3
          }
        }
      }
    },
    {
      "id": "hot10:prevSmall>=5",
      "formula": "近10期热码前6",
      "trigger": "上期小号>=5",
      "triggerId": "prevSmall>=5",
      "poolSize": 6,
      "evaluatedDraws": 2238,
      "triggeredDraws": 180,
      "skippedDraws": 2058,
      "hits": 3,
      "hitRate": 1.67,
      "coverageRate": 8.04,
      "maxTriggeredMissStreak": 67,
      "byYear": {
        "2020": {
          "evaluatedDraws": 216,
          "triggeredDraws": 13,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 6.02,
          "maxTriggeredMissStreak": 13
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 25,
          "hits": 1,
          "hitRate": 4,
          "coverageRate": 6.85,
          "maxTriggeredMissStreak": 16
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 34,
          "hits": 1,
          "hitRate": 2.94,
          "coverageRate": 9.32,
          "maxTriggeredMissStreak": 25
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 25,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 6.85,
          "maxTriggeredMissStreak": 25
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 35,
          "hits": 1,
          "hitRate": 2.86,
          "coverageRate": 9.56,
          "maxTriggeredMissStreak": 19
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 30,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 8.29,
          "maxTriggeredMissStreak": 30
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 18,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 9.05,
          "maxTriggeredMissStreak": 18
        }
      },
      "latestPool": [
        "19",
        "24",
        "30",
        "37",
        "45",
        "48"
      ],
      "latestTriggered": {
        "issue": 189,
        "date": "2026-07-08",
        "year": "2026",
        "pool": [
          "01",
          "05",
          "09",
          "10",
          "23",
          "38"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 5,
          "zoneCount": 3,
          "oddCount": 3
        },
        "triggerState": {
          "missStreak": 136,
          "previousShape": {
            "smallCount": 5,
            "zoneCount": 3,
            "oddCount": 3
          }
        }
      }
    },
    {
      "id": "hot5:prevSmall>=5",
      "formula": "近5期热码前6",
      "trigger": "上期小号>=5",
      "triggerId": "prevSmall>=5",
      "poolSize": 6,
      "evaluatedDraws": 2243,
      "triggeredDraws": 180,
      "skippedDraws": 2063,
      "hits": 3,
      "hitRate": 1.67,
      "coverageRate": 8.02,
      "maxTriggeredMissStreak": 67,
      "byYear": {
        "2020": {
          "evaluatedDraws": 221,
          "triggeredDraws": 13,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 5.88,
          "maxTriggeredMissStreak": 13
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 25,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 6.85,
          "maxTriggeredMissStreak": 25
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 34,
          "hits": 2,
          "hitRate": 5.88,
          "coverageRate": 9.32,
          "maxTriggeredMissStreak": 25
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 25,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 6.85,
          "maxTriggeredMissStreak": 25
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 35,
          "hits": 1,
          "hitRate": 2.86,
          "coverageRate": 9.56,
          "maxTriggeredMissStreak": 19
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 30,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 8.29,
          "maxTriggeredMissStreak": 30
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 18,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 9.05,
          "maxTriggeredMissStreak": 18
        }
      },
      "latestPool": [
        "04",
        "19",
        "21",
        "24",
        "30",
        "48"
      ],
      "latestTriggered": {
        "issue": 189,
        "date": "2026-07-08",
        "year": "2026",
        "pool": [
          "01",
          "05",
          "12",
          "22",
          "36",
          "38"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 5,
          "zoneCount": 3,
          "oddCount": 3
        },
        "triggerState": {
          "missStreak": 66,
          "previousShape": {
            "smallCount": 5,
            "zoneCount": 3,
            "oddCount": 3
          }
        }
      }
    },
    {
      "id": "hot10:prevSmall>=5-or-prevZone<=2",
      "formula": "近10期热码前6",
      "trigger": "上期小号>=5 或 上期区间数<=2",
      "triggerId": "prevSmall>=5-or-prevZone<=2",
      "poolSize": 6,
      "evaluatedDraws": 2238,
      "triggeredDraws": 210,
      "skippedDraws": 2028,
      "hits": 3,
      "hitRate": 1.43,
      "coverageRate": 9.38,
      "maxTriggeredMissStreak": 77,
      "byYear": {
        "2020": {
          "evaluatedDraws": 216,
          "triggeredDraws": 17,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 7.87,
          "maxTriggeredMissStreak": 17
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 27,
          "hits": 1,
          "hitRate": 3.7,
          "coverageRate": 7.4,
          "maxTriggeredMissStreak": 18
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 37,
          "hits": 1,
          "hitRate": 2.7,
          "coverageRate": 10.14,
          "maxTriggeredMissStreak": 28
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 32,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 8.77,
          "maxTriggeredMissStreak": 32
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 41,
          "hits": 1,
          "hitRate": 2.44,
          "coverageRate": 11.2,
          "maxTriggeredMissStreak": 21
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 37,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 10.22,
          "maxTriggeredMissStreak": 37
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 19,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 9.55,
          "maxTriggeredMissStreak": 19
        }
      },
      "latestPool": [
        "19",
        "24",
        "30",
        "37",
        "45",
        "48"
      ],
      "latestTriggered": {
        "issue": 189,
        "date": "2026-07-08",
        "year": "2026",
        "pool": [
          "01",
          "05",
          "09",
          "10",
          "23",
          "38"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 5,
          "zoneCount": 3,
          "oddCount": 3
        },
        "triggerState": {
          "missStreak": 136,
          "previousShape": {
            "smallCount": 5,
            "zoneCount": 3,
            "oddCount": 3
          }
        }
      }
    },
    {
      "id": "hot5:prevSmall>=5-or-prevZone<=2",
      "formula": "近5期热码前6",
      "trigger": "上期小号>=5 或 上期区间数<=2",
      "triggerId": "prevSmall>=5-or-prevZone<=2",
      "poolSize": 6,
      "evaluatedDraws": 2243,
      "triggeredDraws": 210,
      "skippedDraws": 2033,
      "hits": 3,
      "hitRate": 1.43,
      "coverageRate": 9.36,
      "maxTriggeredMissStreak": 77,
      "byYear": {
        "2020": {
          "evaluatedDraws": 221,
          "triggeredDraws": 17,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 7.69,
          "maxTriggeredMissStreak": 17
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 27,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 7.4,
          "maxTriggeredMissStreak": 27
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 37,
          "hits": 2,
          "hitRate": 5.41,
          "coverageRate": 10.14,
          "maxTriggeredMissStreak": 27
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 32,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 8.77,
          "maxTriggeredMissStreak": 32
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 41,
          "hits": 1,
          "hitRate": 2.44,
          "coverageRate": 11.2,
          "maxTriggeredMissStreak": 21
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 37,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 10.22,
          "maxTriggeredMissStreak": 37
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 19,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 9.55,
          "maxTriggeredMissStreak": 19
        }
      },
      "latestPool": [
        "04",
        "19",
        "21",
        "24",
        "30",
        "48"
      ],
      "latestTriggered": {
        "issue": 189,
        "date": "2026-07-08",
        "year": "2026",
        "pool": [
          "01",
          "05",
          "12",
          "22",
          "36",
          "38"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 5,
          "zoneCount": 3,
          "oddCount": 3
        },
        "triggerState": {
          "missStreak": 66,
          "previousShape": {
            "smallCount": 5,
            "zoneCount": 3,
            "oddCount": 3
          }
        }
      }
    },
    {
      "id": "hot10:prevZone<=2",
      "formula": "近10期热码前6",
      "trigger": "上期区间数<=2",
      "triggerId": "prevZone<=2",
      "poolSize": 6,
      "evaluatedDraws": 2238,
      "triggeredDraws": 46,
      "skippedDraws": 2192,
      "hits": 0,
      "hitRate": 0,
      "coverageRate": 2.06,
      "maxTriggeredMissStreak": 46,
      "byYear": {
        "2020": {
          "evaluatedDraws": 216,
          "triggeredDraws": 5,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 2.31,
          "maxTriggeredMissStreak": 5
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 4,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 1.1,
          "maxTriggeredMissStreak": 4
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 4,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 1.1,
          "maxTriggeredMissStreak": 4
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 9,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 2.47,
          "maxTriggeredMissStreak": 9
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 13,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 3.55,
          "maxTriggeredMissStreak": 13
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 9,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 2.49,
          "maxTriggeredMissStreak": 9
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 2,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 1.01,
          "maxTriggeredMissStreak": 2
        }
      },
      "latestPool": [
        "19",
        "24",
        "30",
        "37",
        "45",
        "48"
      ],
      "latestTriggered": {
        "issue": 127,
        "date": "2026-05-07",
        "year": "2026",
        "pool": [
          "07",
          "18",
          "22",
          "23",
          "38",
          "46"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 6,
          "zoneCount": 2,
          "oddCount": 5
        },
        "triggerState": {
          "missStreak": 74,
          "previousShape": {
            "smallCount": 6,
            "zoneCount": 2,
            "oddCount": 5
          }
        }
      }
    },
    {
      "id": "hot5:prevZone<=2",
      "formula": "近5期热码前6",
      "trigger": "上期区间数<=2",
      "triggerId": "prevZone<=2",
      "poolSize": 6,
      "evaluatedDraws": 2243,
      "triggeredDraws": 46,
      "skippedDraws": 2197,
      "hits": 0,
      "hitRate": 0,
      "coverageRate": 2.05,
      "maxTriggeredMissStreak": 46,
      "byYear": {
        "2020": {
          "evaluatedDraws": 221,
          "triggeredDraws": 5,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 2.26,
          "maxTriggeredMissStreak": 5
        },
        "2021": {
          "evaluatedDraws": 365,
          "triggeredDraws": 4,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 1.1,
          "maxTriggeredMissStreak": 4
        },
        "2022": {
          "evaluatedDraws": 365,
          "triggeredDraws": 4,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 1.1,
          "maxTriggeredMissStreak": 4
        },
        "2023": {
          "evaluatedDraws": 365,
          "triggeredDraws": 9,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 2.47,
          "maxTriggeredMissStreak": 9
        },
        "2024": {
          "evaluatedDraws": 366,
          "triggeredDraws": 13,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 3.55,
          "maxTriggeredMissStreak": 13
        },
        "2025": {
          "evaluatedDraws": 362,
          "triggeredDraws": 9,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 2.49,
          "maxTriggeredMissStreak": 9
        },
        "2026": {
          "evaluatedDraws": 199,
          "triggeredDraws": 2,
          "hits": 0,
          "hitRate": 0,
          "coverageRate": 1.01,
          "maxTriggeredMissStreak": 2
        }
      },
      "latestPool": [
        "04",
        "19",
        "21",
        "24",
        "30",
        "48"
      ],
      "latestTriggered": {
        "issue": 127,
        "date": "2026-05-07",
        "year": "2026",
        "pool": [
          "05",
          "10",
          "15",
          "17",
          "22",
          "39"
        ],
        "hit": false,
        "previousShape": {
          "smallCount": 6,
          "zoneCount": 2,
          "oddCount": 5
        },
        "triggerState": {
          "missStreak": 4,
          "previousShape": {
            "smallCount": 6,
            "zoneCount": 2,
            "oddCount": 5
          }
        }
      }
    }
  ]
};
