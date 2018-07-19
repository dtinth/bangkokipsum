// @ts-check
function main() {
  fetch('idol64.json')
    .then(r => r.json())
    .then(startApp)
}

function startApp(model) {
  let paragraphsLeft = 3
  let nextParagraphIndex = 0
  let facebookInitialized
  /** @type {HTMLButtonElement} */
  const moreButton = document.querySelector('#more')
  function run() {
    Object.assign(window, { model, createGenerator })
    document.querySelector('#loading').remove()
    generateParagraph(callback)
    moreButton.addEventListener('click', function(e) {
      e.preventDefault()
      moreButton.blur()
      moreButton.disabled = true
      paragraphsLeft = 3
      generateParagraph(callback)
    })
  }
  function callback() {
    paragraphsLeft -= 1
    if (paragraphsLeft > 0) {
      generateParagraph(callback)
    } else {
      moreButton.classList.remove('hide')
      moreButton.disabled = false
      document.querySelector('#social').classList.remove('hide')
      if (!facebookInitialized) {
        facebookInitialized = true
        initializeFacebook()
      }
    }
  }

  /**
   * @param {() => any} onFinish
   */
  function generateParagraph(onFinish) {
    const index = nextParagraphIndex++
    const seed = ['แอบ', 'มอง']
    const fixedHistory = index === 0 ? seed : []
    const generator = createGenerator(fixedHistory)
    const p = document.createElement('p')
    let currentSentence
    let data = ''
    let sentenceCount = 0
    const desiredSentenceCount = 6 + Math.round(Math.random() * 3)
    document.querySelector('#result').appendChild(p)
    function frame() {
      let start = performance.now()
      for (;;) {
        if (next() === true) {
          return onFinish()
        }
        if (performance.now() - start >= 16) {
          requestAnimationFrame(frame)
          break
        }
      }
    }
    function next() {
      const token = generator.generateNextToken()
      if (!currentSentence) {
        currentSentence = document.createElement('span')
        p.appendChild(currentSentence)
      }
      data += token
      if (token === ' ') {
        currentSentence.textContent = data
        currentSentence = null
        data = ''
        return ++sentenceCount >= desiredSentenceCount
      } else {
        currentSentence.appendChild(document.createTextNode('…'))
        return false
      }
    }
    frame()
  }

  function createGenerator(fixedHistory) {
    const queue = fixedHistory.slice()
    let history = [-1]
    let wordCount = 0
    let sentenceLength = 0
    let targetSentenceLength = 0

    function generateNextToken() {
      if (queue.length) {
        const word = queue.shift()
        history.push(model.words.indexOf(word))
        return word
      }
      if (!targetSentenceLength) {
        targetSentenceLength = 5 + Math.floor(Math.random() * 10)
      }
      const spaceWeightFactor = Math.pow(
        Math.max(sentenceLength - targetSentenceLength, 0) / 2,
        2
      )
      const weights = weightsFor(history, model, spaceWeightFactor)
      const key = pick(weights)
      history.push(key)
      if (+key === -1) {
        sentenceLength = 0
        targetSentenceLength = 0
        return ' '
      } else {
        sentenceLength += 1
        return model.words[key]
      }
    }

    return { generateNextToken }
  }

  run()
}

function weightsFor(history, model, spaceWeightFactor) {
  const max = Math.min(history.length, model.trie.max)
  const data = model.trie.data
  /** @type {[string, number][]} */
  const weights = Object.keys(data).map(key => {
    const statistic = data[key]
    let weight = 0.0001
    for (let n = 0; n <= max; n++) {
      weight += Math.pow(
        (statistic[history.slice(-n)] || 0) * Math.pow(n, 2),
        2
      )
    }
    /** @type {[string, number]} */
    const result = [key, weight * (+key === -1 ? spaceWeightFactor : 1)]
    return result
  })
  weights.sort(([_1, a], [_2, b]) => a - b)
  let value = 0
  weights.forEach(current => {
    value += (current[1] - value) / 4
    current[1] = value
  })
  return weights
}

function pick(weights) {
  let total = 0
  weights.forEach(current => {
    total += current[1]
  })
  const picked = Math.random() * total
  let current = 0
  let out
  weights.some(([key, weight]) => {
    out = key
    current += weight
    if (current >= picked) return true
  })
  return out
}

function initializeFacebook() {
  /** @type {any} */
  var global = window

  Object.assign(window, {
    fbAsyncInit: function() {
      global.FB.init({
        appId: '207894113251376',
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v3.0'
      })
      initializeQuotingSystem()
    }
  })
  ;(function(d, s, id) {
    var js,
      fjs = d.getElementsByTagName(s)[0]
    if (d.getElementById(id)) {
      return
    }
    js = d.createElement(s)
    js.id = id
    // @ts-ignore
    js.src = 'https://connect.facebook.net/en_US/sdk.js'
    fjs.parentNode.insertBefore(js, fjs)
  })(document, 'script', 'facebook-jssdk')
}

function initializeQuotingSystem() {
  /** @type {any} */
  var global = window

  let textToShare = ''

  /** @type {HTMLButtonElement} */
  const shareButton = document.querySelector('#share-quote')

  document.addEventListener('selectionchange', function(event) {
    const result = document.querySelector('#result')
    /** @type {HTMLButtonElement} */
    const shareContainer = document.querySelector('#share')
    const selection = window.getSelection()
    if (
      result.contains(selection.anchorNode) &&
      result.contains(selection.focusNode) &&
      selection.toString().trim()
    ) {
      shareContainer.classList.add('shareable')
      shareButton.disabled = false
      textToShare = selection.toString()
    } else {
      shareContainer.classList.remove('shareable')
    }
  })

  shareButton.addEventListener('click', () => {
    global.FB.ui(
      {
        method: 'share',
        href: 'https://bangkokipsum.app/',
        quote: textToShare
      },
      function(response) {}
    )
  })
}

main()
