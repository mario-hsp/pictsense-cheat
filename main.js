let wordList

await (async function init() {
	// jQuery読み込み
	let script = document.createElement('script')
	script.setAttribute('src','//code.jquery.com/jquery-1.10.2.js')
	document.head.appendChild(script)

	// 辞書読み込み
	document.getElementById('roomDataButton').click()
	const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	await _sleep(1000);
	document.querySelector('h1 > .cancel').click()

	// 単語読み込み
	wordList = await (async function getWordList() {
		function getDics() {
			try {
				const options = document.getElementById('dDic').options
				let dics = []
				for (const option of options) {
					dics.push(option.innerHTML)
				}
				return dics
			} catch (error) {
				console.error(error);
			}
		}
		async function getDicValue(dicName) {
			const getDoc = async url => {
				function getData(url) {
					return $.ajax(url)
				}
				const res = await getData(url)
				const parser = new DOMParser()
				const doc = parser.parseFromString(res, 'text/html')
				return doc
			}
		
			let dicID
			const search = await getDoc(encodeURI('https://pictsense.com/dic/list/?q=' + dicName + '&sort=new'))
			dicID = search.getElementById('dicList').children[0].dataset.no
		
			const words = []
			const doc = await getDoc('https://pictsense.com/dic/n' + dicID)
			const wordList = doc.getElementById('words').children
			for (let i = 0; i < wordList.length; i++) {
				words.push(wordList[i].innerHTML)
			}
			return words
		}
		
		let result = []
		await Promise.all(getDics().map(async dic => {
			const dicValue = await getDicValue(dic)
			result = result.concat(dicValue)
		}))
		return result
	})()

	// UI変更
	const suggestList = document.createElement('ul')
	suggestList.id = 'suggestList'
	document.getElementById('userListField').appendChild(suggestList)

	// style
	$('#suggestList').css({
		'background-color': '#cdf',
		'height': '300px',
		'margin': '0 auto',
		'border': 'solid 1px #aaa',
		'overflow': 'hidden auto'
	})
})()

async function displaySuggestions() {
	// 候補単語取得
	const suggestWordList = await (async function showSuggestions() {
		async function getSuggestion(length, begin='', end='', suggest=[]) {
			const suggestWords = wordList.filter(word => {
				if (word.length === length && word.startsWith(begin) && word.endsWith(end)) {
					if (suggest.length === 0) {
						return true
					}else {
						let match = true
						word.split('').forEach((char,i) => {
							let charMatch = false
							suggest[i].forEach(charListed => { if (charListed === char) charMatch = true })
							if (!charMatch) match = false
						})
						return match
					}
				}else {
					return false
				}
			})
			return suggestWords
		}
		
		const subject = document.getElementById('subject').innerHTML
		const hints = {
			length: subject.length,
			begin: subject.split('○')[0],
			end: subject.split('○').slice(-1)[0],
			suggest: (function getCharButton() {
				const chatText = document.getElementById('chatText')
				const charList = document.getElementById('charList')
				if (charList.innerHTML === '') return []
				let result = []
				const beforeValue = chatText.value
				chatText.value = ''
				for (let i = 0; i < subject.length; i++) {
					result[i] = []
					chatText.dispatchEvent(new Event('change'))
					const charButtons = charList.children
					for (let j = 0; j < charButtons.length; j++) {
						result[i].push(charButtons[j].innerText)
					}
					chatText.value += ' '
				}
				chatText.value = beforeValue
				chatText.dispatchEvent(new Event('change'))
				return result
			})()
		}
		return await getSuggestion(hints.length, hints.begin, hints.end, hints.suggest)
	})()

	// 画面に表示
	const suggestList = document.getElementById('suggestList')
	suggestList.innerHTML = ''
	suggestWordList.forEach(word => {
		const suggest = document.createElement('li')
		suggest.classList.add('suggest')
		suggest.innerHTML = '<button onclick="sendAnswer(\'' + word + '\')">' + word + '</button>'
		suggestList.appendChild(suggest)
	})
	// style
	$('.suggest > button').css({
		'width': '100%',
		'height': 'auto',
		'padding': '5px'
	})
}

(function main() {
	const observer = new MutationObserver(async () => {
		await displaySuggestions()
	})
	observer.observe(document.getElementById('chatMessage'), {
		childList: true
	})
})()


function sendAnswer(answer) {
	const chatText = document.getElementById('chatText')
	const submitButton = document.getElementById('chatSubmitButton')
	const beforeValue = chatText.value
	chatText.value = answer
	submitButton.click()
	chatText.value = beforeValue
}