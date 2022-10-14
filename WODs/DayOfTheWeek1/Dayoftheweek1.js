var day = 15;
var month = "December";
var year = 2001;

const monthkey = {
    January:0,
    February:3,
    March:2,
    April:5,
    May:0,
    June:3,
    July:5,
    August:1,
    September:4,
    October:6,
    November:2,
    December:4,
};

if (month=="January"||month=="February"){
    year=year-1;
}
else {};

step2 = parseInt(year/4)+year;

step3 = step2-parseInt(year/100);

step4 = parseInt(year/400)+step3;

step5 = day+step4;

step6 = monthkey[month] + step5;

step7 = step6%7;

const daysarray = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

console.log(month, day, year, daysarray[step7]);
