export const LINE_DATA = {
  labels: ["1", "2", "3", "4", "5", "6"],
  datasets: [
    {
      label: "# of Sales",
      data: [3, 5, 2, 3, 12, 19],
      fill: false,
      backgroundColor: "rgb(20, 46, 113)",
      borderColor: "rgba(20, 46, 113, 0.2)",
    },
  ],
};
export const LINE_DATA_DECREASE = {
  labels: ["1", "2", "3", "4", "5", "6"],
  datasets: [
    {
      label: "# of Sales",
      data: [3, 12, 19, 3, 5, 2],
      fill: false,
      backgroundColor: "rgb(20, 46, 113)",
      borderColor: "rgba(20, 46, 113, 0.2)",
    },
  ],
};

export const BUBBLE_DATA = {
  labels: ["a", "b", "c"],
  datasets: [
    {
      label: "Food",
      data: [
        { x: 10, y: 20, r: 5 },
        { x: 100, y: 200, r: 5 },
        { x: 400, y: 250, r: 5 },
        { x: 700, y: 570, r: 20 },
      ],
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      borderColor: "#694b51",
      borderWidth: 1,
    },
  ],
};

export const BUBBLE_OPTION = {
  maintainAspectRatio: true,
  scales: {
    xAxes: [
      {
        stacked: true,
      },
    ],
    yAxes: [
      {
        stacked: true,
      },
    ],
  },
  legend: {
    labels: {
      fontSize: 20,
    },
  },
  tooltips: {
    enabled: true,
  },
};

export const MIXED_DATA = {
  labels: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  // data: {
  datasets: [
    {
      type: "line",
      label: "Sales",
      data: [51, 65, 40, 49, 60, 37, 40, 51, 65, 40, 49],
      fill: false,
      borderColor: "#EC932F",
      backgroundColor: "#EC932F",
      pointBorderColor: "#EC932F",
      pointBackgroundColor: "#EC932F",
      pointHoverBackgroundColor: "#EC932F",
      pointHoverBorderColor: "#EC932F",
    },
    {
      type: "bubble",
      label: "Food",
      data: [
        { x: 100, y: 200, r: 15 },
        { x: 10, y: 20, r: 8 },
        { x: 40, y: 50, r: 9 },
        { x: 70, y: 70, r: 10 },
      ],
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      borderColor: "#694b51",
      borderWidth: 1,
    },
    {
      type: "bubble",
      label: "bubble",
      fill: true,
      lineTension: 0.1,
      backgroundColor: "#cc6060",
      borderColor: "rgba(75,192,192,1)",
      // borderDash: [],
      borderDashOffset: 0.0,
      pointBorderColor: "#020c0c",
      pointBackgroundColor: "#fff",
      pointBorderWidth: 1,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "#8c1ca8",
      pointHoverBorderColor: "#291212",
      pointHoverBorderWidth: 2,
      pointRadius: 1,
      pointHitRadius: 10,
      data: [
        { x: 10, y: 20, r: 5 },
        { x: 100, y: 200, r: 5 },
        { x: 400, y: 250, r: 5 },
        { x: 700, y: 570, r: 20 },
      ],
    },
    {
      type: "bar",
      label: "Visitor",
      data: [200, 185, 590, 621, 250, 400, 95, 185, 590, 621, 250, 100],
      fill: false,
      backgroundColor: "#71B37C",
      borderColor: "#71B37C",
      hoverBackgroundColor: "#1a291c",
      hoverBorderColor: "#71B37C",
    },
  ],
  // },
};

export const RADAR_DATA = {
  labels: [
    "Eating",
    "Drinking",
    "Sleeping",
    "Designing",
    "Coding",
    "Cycling",
    "Running",
  ],
  datasets: [
    {
      label: "Desktops",
      backgroundColor: "rgba(52, 195, 143, 0.2)",
      borderColor: "#34c38f",
      pointBackgroundColor: "#34c38f",
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "#34c38f",
      data: [65, 59, 90, 81, 56, 55, 40],
    },
    {
      label: "Tablets",
      backgroundColor: "rgba(85, 110, 230, 0.2)",
      borderColor: "#556ee6",
      pointBackgroundColor: "#556ee6",
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "#556ee6",
      data: [28, 48, 40, 19, 96, 27, 100],
    },
    {
      label: "Mobiles",
      backgroundColor: "rgba(50, 10, 230, 0.2)",
      borderColor: "#556ee6",
      pointBackgroundColor: "#556ee6",
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "#556ee6",
      data: [91, 96, 27, 100, 100, 78, 50],
    },
  ],
};

export const POLAR_DATA = {
  datasets: [
    {
      data: [11, 16, 7, 18],
      backgroundColor: ["#f46a6a", "#34c38f", "#f1b44c", "#556ee6"],
      label: "My dataset", // for legend
      hoverBorderColor: "#fff",
    },
  ],
  labels: ["Series 1", "Series 2", "Series 3", "Series 4"],
};
