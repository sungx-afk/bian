import {timesToDate, dateToTimes} from '@/config/utils'

export default class Plan {
	constructor(){
		const now = new Date();

		//获取当前天
    this.currentDay = timesToDate(now.getTime(),'yyyyMMdd');
		//获取当前周
		const start = new Date(now.getFullYear(), 0, 1);
		const end = new Date(start.getFullYear() + 1, 0, 1);
		const week = start.getDay();
		if(week != 1){
			if(week == 0){
				start.setDate(start.getDate() - 6);
			} else {
				start.setDate(start.getDate() - (week - 1));
			}
		}
		let w = 0;
		while (start < end){
			let o = {};
			o.start = start.getTime();
			start.setDate(start.getDate() + 7);
			o.end = start.getTime();
			o.id = w;
			w ++;
			if(now.getTime() >= o.start && now.getTime() < o.end){
				this.currentWeek = `${now.getFullYear()}${Plan.addZero(o.id + 1)}`;
			}
		}

		//获取当前月
		this.currentMonth = `${now.getFullYear()}${Plan.addZero(now.getMonth() + 1)}`;

		//获取当前季
		if(now.getMonth() >= 0 && now.getMonth() < 3){
			this.currentSeason = `${now.getFullYear()}01`;
		}else if(now.getMonth() >= 3 && now.getMonth() < 6){
			this.currentSeason = `${now.getFullYear()}02`;
		}else if(now.getMonth() >= 6 && now.getMonth() < 9){
			this.currentSeason = `${now.getFullYear()}03`;
		}else if(now.getMonth() >= 9 && now.getMonth() < 12){
			this.currentSeason = `${now.getFullYear()}04`;
		}

		//获取当前年
		this.currentYear = `${now.getFullYear()}`;
	}

	static weekCount(year){
		const start = new Date(year, 0, 1);
		const end = new Date(start.getFullYear() + 1, 0, 1);
		const week = start.getDay();
		if(week != 1){
			if(week == 0){
				start.setDate(start.getDate() - 6);
			} else {
				start.setDate(start.getDate() - (week - 1));
			}
		}
		let num = 0;
		while (start < end){
			start.setDate(start.getDate() + 7);
			num ++;
		}
		return num;
	}

	static monthCount(){
		return 12;
	}

	static seasonCount(){
		return 4;
	}

	static nextYear(year){
		return typeof year === 'number' ? `${year + 1}` : `${parseInt(year) + 1}`;
	}

	static previousYear(year){
		return typeof year === 'number' ? `${year - 1}` : `${parseInt(year) - 1}`;
	}

	static nextSeason(season){
		const y = parseInt(season.toString().substr(0, 4));
		const s = parseInt(season.toString().substr(4, 2));
		return s + 1 > this.seasonCount() ? `${y + 1}01` : `${y}${this.addZero(s + 1)}`;
	}

	static previousSeason(season){
		const y = parseInt(season.toString().substr(0, 4));
		const s = parseInt(season.toString().substr(4, 2));
		return s - 1 < 1 ? `${y - 1}${this.addZero(this.seasonCount())}` : `${y}${this.addZero(s - 1)}`;
	}

	static nextMonth(month){
		const y = parseInt(month.toString().substr(0, 4));
		const m = parseInt(month.toString().substr(4, 2));
		return m + 1 > this.monthCount() ? `${y + 1}01` : `${y}${this.addZero(m + 1)}`;
	}

	static previousMonth(month){
		const y = parseInt(month.toString().substr(0, 4));
		const m = parseInt(month.toString().substr(4, 2));
		return m - 1 < 1 ? `${y - 1}${this.addZero(this.monthCount())}` : `${y}${this.addZero(m - 1)}`;
	}

	static nextWeek(week){
		const y = parseInt(week.toString().substr(0, 4));
		const w = parseInt(week.toString().substr(4, 2));
		return w + 1 > this.weekCount(y) ? `${y + 1}01` : `${y}${this.addZero(w + 1)}`;
	}

	static previousWeek(week){
		const y = parseInt(week.toString().substr(0, 4));
		const w = parseInt(week.toString().substr(4, 2));
		return w - 1 < 1 ? `${y - 1}${this.addZero(this.weekCount(y - 1))}` : `${y}${this.addZero(w - 1)}`;
	}

  static previousDay(day){
    let y = parseInt(day.toString().substr(0, 4));
    let m = parseInt(day.toString().substr(4, 2));
    let d = parseInt(day.toString().substr(6, 2));
    let date = new Date(y,m - 1,d)
    let time = dateToTimes(timesToDate(date.getTime()),'yyyyMMdd')
    return timesToDate(time - 24 * 60 * 60 * 1000,'yyyyMMdd')
  }

  static nextDay(day){
    let y = parseInt(day.toString().substr(0, 4));
    let m = parseInt(day.toString().substr(4, 2));
    let d = parseInt(day.toString().substr(6, 2));
    let date = new Date(y,m - 1,d)
    let time = dateToTimes(timesToDate(date.getTime()),'yyyyMMdd')
    return timesToDate(time + 24 * 60 * 60 * 1000,'yyyyMMdd')
  }


	static addZero(v) {
		if (v < 10) return '0' + v;
		return v.toString();
	}

	static ucFirst(v){
		return v.replace(/\b\w+\b/g, word => {
		  return word.substring(0,1).toUpperCase() + word.substring(1);
		})
	}
}
