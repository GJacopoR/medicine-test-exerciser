import './App.css'
import { useEffect, useState } from 'react'
import { Markup } from 'interweave'
import reactStringReplace from 'react-string-replace';

interface Answer {
  id: string
  text: string
}

interface Question {
  id: number
  domanda: string
  argomento: string
  nro: number
  risposte: Answer[]
  branoId: number |null
}

type Api = {
  id: string
  domande: Question[]
}

const getCategorySlug = (category: Question['argomento']) => {
  switch (category) {
    case 'biologia':
      return 'biologia';
    case 'chimica':
      return 'chimica';
    case 'fisica e matematica':
      return 'fis-mat';
    case 'ragionamento logico e problemi':
      return 'logica';
  
    default:
      return category;
  }
}

function App() {

  const [currentQuestion, setCurrentQuestion] = useState<Question | undefined>()
  const [currentImgSrc, setCurrentImgSrc] = useState<string[]>([])
  const [currentPassage, setCurrentPassage] = useState<string>('')
  const [isAnswerGiven, setIsAnswerGiven] = useState<boolean>(false)
  const [isQuestionOver, setIsQuestionOver] = useState<boolean>(false)

  const imgId = currentQuestion?.domanda.includes('includegraphics') ? currentQuestion?.domanda.substring(currentQuestion.domanda.indexOf("includegraphics")) : ''
  console.log({imgId})

  useEffect(() => {
    setCurrentImgSrc([])
    setCurrentPassage('')

    fetch('https://domande-ap.mur.gov.it/api/v1/prova')
      .then((res) => {
        return res.json();
      })
      .then((data: Api) => {
        const currentRecievedQuestions = data.domande

        setCurrentQuestion(currentRecievedQuestions[Math.floor(Math.random() * (currentRecievedQuestions.length)) ])
      });
  }, [isQuestionOver]);

  useEffect(() => {
    if (!currentQuestion || !imgId) return;
      const category = getCategorySlug(currentQuestion.argomento)
      const regex = /\{(.*?)\}/;
      const imgQuery = imgId.match(regex)

    fetch(`https://domande-ap.mur.gov.it/assets/includeGraphics/${category}/${imgQuery && imgQuery[1]}`)
      .then((res) => res.url)
      .then((data: string) => {
        if (!currentImgSrc.includes(data)) {
          setCurrentImgSrc((prev) => [...prev, data]);
        }
      }).catch((e) => console.error(e.message));
  }, [currentQuestion?.domanda]);

  useEffect(() => {
    if(!currentQuestion?.branoId) return;

    fetch(`https://domande-ap.mur.gov.it/api/v1/domanda/brano/${currentQuestion.branoId}`)
      .then((res) => {
        return res.json();
      })
      .then((data: {id: string, brano: string}) => {
        setCurrentPassage(data.brano)
      });
  }, [currentQuestion?.branoId])

  const handleAnswerClick = (e: React.MouseEvent<HTMLDivElement>, answer: Answer) => {
    setIsAnswerGiven(true)

    if (answer.id !== 'a') {
      e.currentTarget.classList.add('clickedAnswer'); 
    }
  }

  const handleRefreshQuestion = () => {
    const clickedElements: NodeListOf<HTMLElement> = document.querySelectorAll('.clickedAnswer');
    clickedElements.forEach((element:HTMLElement) => {
      element.classList.remove('clickedAnswer');
    });

    setIsAnswerGiven(false);
    setIsQuestionOver(!isQuestionOver);
  }

  // console.log('cqa', currentQuestion)
  // console.log('currentImg', currentImgSrc)

  // const image = <picture>
  //   <img src={currentImgSrc[0]} alt="img" />
  // </picture>

  // const question = currentQuestion?.domanda.replace('includegraphics', image)

  return currentQuestion?.domanda && <main>
    <header className='question'>
      <h1 className='category'>
        {currentQuestion?.argomento.toLocaleUpperCase() + ' - ' + currentQuestion?.nro}
      </h1>

      {currentPassage && <div className='brano' >
        {currentPassage}
      </div>}

      <Markup content={currentQuestion?.domanda} />
    </header>

    {currentImgSrc?.length > 0 && <picture>
      <img src={currentImgSrc[0]} alt="img" />
    </picture>}

     <article className='answers'>
      {currentQuestion.risposte.map((risposta, index) => {
        return <div className={isAnswerGiven ? (risposta.id === 'a' ? 'correct' : ''): ''} key={risposta.id} onClick={(e) => handleAnswerClick(e, risposta)}> <Markup content={index+1 + ') ' + risposta.text} /></div>
      })}
    </article>

    <footer>
      <button className="refresh" onClick={handleRefreshQuestion}>
        Nuova domanda
      </button>
    </footer>
  </main>
}

export default App;
