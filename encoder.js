/////=================Генератор последовательности==================
function generateSequence() {
	let stubBits = [0, 0, 0, 0, 0, 0, 0, 0]
	let outputCode = [...stubBits]

	for (let index = 0; index < 12; index++) {
		////цикл формирования сверхциклов ( возьмем для примера 12)
		outputCode = [...outputCode, ...generateSuperCycle(index)]
	}

	return outputCode.concat(stubBits)
}

function generateSuperCycle(iSuperCycle) {
	let outputCode = []
	for (let index = 0; index <= 15; index++) {
		// сверхцикл состоит из 16 циклов
		outputCode = [...outputCode, ...generateCycle(index, iSuperCycle)]
	}
	return outputCode
}

function generateCycle(cycleIndex, iSuperCycle) {
	let outputCode = []
	for (let index = 0; index <= 31; index++) {
		// цикл состоит из 32 канальных интервалов
		outputCode = [
			...outputCode,
			...generateTimeslot(index, cycleIndex, iSuperCycle),
		]
	}
	return outputCode
}

function generateTimeslot(timeslotIndex, cycleIndex, iSuperCycle) {
	let errorBit = cycleIndex ? Math.floor(Math.random() * 2) : 1 // имитация помех в линии
	errorBit = iSuperCycle >= 2 && iSuperCycle <= 4 ? 0 : errorBit /// имитация потери цикловой сс
	let frameSync = [0, 0, errorBit, 1, 0, 1, 1]

	if (timeslotIndex === 0) {
		///определяем первый канальный интервал
		if (cycleIndex % 2 === 0) {
			return [0, ...frameSync] /// в четных циклах передается первым битом контроль ошибок, а остальное цикловая сс (frameSync)
		} else {
			return [0, 1, 0, 1, 1, 0, 1, 1] /// в нечетных различная служебная информация
		}
	}

	if (timeslotIndex === 16) {
		//определяем 16 канальный интервал
		if (cycleIndex === 0) {
			return [0, 0, 0, 0, 1, 0, 0, 1] // в нулевом цикле первые четыре бита сверхцикловой сс
		} else {
			return [1, 1, 0, 1, 1, 1, 0, 1] // в остальных циклах сигналы управления и взаимодейтсвия
		}
	}

	return getLoad() // в остальных канальных интервалах передается нагрузкка
}

function getLoad() {
	let outputCode = []

	for (let index = 0; index < 8; index++) {
		outputCode.push(Math.floor(Math.random() * 2))
	}

	return outputCode
	//return [0, 1, 0, 1, 0, 1, 0, 1]
}

///////////////====================================================

class Counters {
	constructor() {}

	expectedSignal = 0
	countN1 = 0 // счетчик входа в синхронизм
	countN2 = 0 // счетчик выхода из синхронизма

	setExpectedSignal(index) {
		this.expectedSignal = generator(index)
	}

	n1Increment() {
		this.countN1++
	}

	n2Increment() {
		this.countN2++
	}

	n2Decrement() {
		this.countN2--
	}

	predeterminationExpSignal(index) {
		return this.expectedSignal || index
	}

	resetCounters() {
		this.countN1 = 0
		this.countN2 = 0
	}

	resetExpSignal() {
		this.expectedSignal = 0
	}
	resetN2() {
		this.countN2 = 0
	}
	resetN1() {
		this.countN1 = 0
	}
}

/////=================Генератор последовательности==================
receiver(generateSequence())

/////=================Выделитель метки цикловой сс==================
function receiver(sequence) {
	let counters = new Counters()

	for (let index = 0; index < sequence.length; index++) {
		if (counters.expectedSignal && index !== counters.expectedSignal) {
			continue
		}
		
		let syncMark = identifier(
			sequence,
			counters.predeterminationExpSignal(index)
		) /// метка цикла

		if (syncMark) {
			
			counters.n1Increment()
			//counters.resetN2()
			counters.setExpectedSignal(index)
		} else if (index === counters.expectedSignal && !syncMark && index) {
			counters.n2Increment()
			counters.setExpectedSignal(index)
		}

		if (counters.countN1 === 8) {
			console.log('синхронизм достигнут!')
			counters.resetCounters()
		}

		if (counters.countN2 === 16) {
			console.log('произошел выход из синхронизма!')
			//-1
			counters.resetN1()
			counters.n2Decrement()
			counters.resetExpSignal()
		}
		debugger
	}
}

function identifier(sequence, start) {
	let seq = [...sequence]
	let frameSync = [0, 0, 1, 1, 0, 1, 1].join('')
	const register = seq.splice(start, 7).join('')
	return register === frameSync
}

function generator(index) {
	let genCycle = 512
	return genCycle + index
}

// function solver(coincidence, counters, index) {
//     if (coincidence) {
//         counters.n1Increment()
//         counters.setExpectedSignal(index)
//     } else {
//         counters.n2Increment()
//     }
//
//     if (counters.countN1 === 8) {
//         console.log('синхронизм достигнут!')
//         counters.resetCounters()
//     }
//
//     if (counters.countN2 === 16) {
//         console.log('произошел выход из синхронизма!')
//         //-1
//         counters.n2Decrement()
//         counters.resetExpSignal()
//     }
// }

// function analyzer(index, expectedSignal) {
//     return index === expectedSignal
// }

/////=================Выделитель метки цикловой сс==================
