import cron from "cron";
import https from "https";

const URL = process.env.BACKEND_URL;

const job = new cron.CronJob("* * * * *", function () {
  https
    .get(`${URL}/api/v1/test`, (res) => {
      if (res.statusCode === 200) {
        console.log("GET request sent Successfully");
      } else {
        console.log("GET request failed : ", res.statusCode);
      }
    })
    .on("error", (e) => {
      console.error("Error while sending get request ", e);
    });
});

export default job;
