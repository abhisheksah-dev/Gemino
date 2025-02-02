import { createContext, useState } from "react";
import run from "../config/gemini";
import { use } from "react";

export const Context = createContext();

const ContextProvider = (props) => {
  const [input, setInput] = useState("");
  const [recentPrompt, setRecentPrompt] = useState("");
  const [prevPrompts, setPrevPrompts] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState("");
  const [documentText, setDocumentText] = useState("");
  const delayPara = (index, nextWord) => {
    setTimeout(function () {
      setResultData((prev) => prev + nextWord);
    }, 75 * index);
  };

  const newChat = () => {
    setLoading(false);
    setShowResult(false);
  };
  const onSent = async (prompt) => {
    console.log("Sending prompt to Gemini:", prompt);
    try {
      setResultData("");
      setLoading(true);
      setShowResult(true);
      const contextPrompt = documentText
        ? `DOCUMENT CONTEXT:\n${documentText}\n\nQUERY: ${prompt || input}`
        : prompt || input;

      // Store prompt before sending
      if (!prompt) {
        setPrevPrompts((prev) => [...prev, input]);
        setRecentPrompt(input);
      }

      const response = await run(contextPrompt);

      let responseArray = response.split("**");
      let newResponse = "";
      for (let i = 0; i < responseArray.length; i++) {
        if (i === 0 || i % 2 !== 1) {
          newResponse += responseArray[i];
        } else {
          newResponse += "<b>" + responseArray[i] + "</b>";
        }
      }
      let newResponse2 = newResponse.split("*").join("</br>");
      let newResponseArray = newResponse2.split(" ");
      for (let i = 0; i < newResponseArray.length; i++) {
        const nextWord = newResponseArray[i];
        delayPara(i, nextWord + " ");
      }
      setLoading(false);
      setInput("");
      console.log("Received response from Gemini:", response);
    } catch (error) {
      console.error("Error while getting response from Gemini:", error);
    }
  };

  const contextValue = {
    prevPrompts,
    setPrevPrompts,
    onSent,
    input,
    setInput,
    recentPrompt,
    setRecentPrompt,
    showResult,
    setShowResult,
    loading,
    setLoading,
    resultData,
    setResultData,
    newChat,
    documentText,
    setDocumentText,
  };

  return (
    <Context.Provider value={contextValue}>{props.children}</Context.Provider>
  );
};

export default ContextProvider;
