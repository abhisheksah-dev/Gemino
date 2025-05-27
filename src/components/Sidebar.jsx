import React, { useContext, useState } from "react";
import { IoReorderThree } from "react-icons/io5";
import { FaPlus } from "react-icons/fa6";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import { IoSettingsOutline } from "react-icons/io5";
import { CiTimer } from "react-icons/ci";
import { MdAttachFile } from "react-icons/md";

import { assets } from "../assets/assets";
import { Context } from "../context/Context";

// Replace the top imports in Sidebar.jsx
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { use } from "react";
// Set worker source using local build (no CDN)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.js",
  import.meta.url
).toString();

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  const {
    onSent,
    prevPrompts,
    recentPrompt,
    setRecentPrompt,
    showResult,
    loading,
    resultData,
    setInput,
    input,
    newChat,
    setDocumentText,
  } = useContext(Context);

  const handleFileUpload = async (file) => {
    try {
      if (!file) {
        alert("Please select a file first");
        return;
      }
      let text = "";
      if (file.type === "application/pdf") {
        // Use the globally imported pdfjsLib (do not re-import it)
        const pdf = await pdfjsLib.getDocument({
          data: await file.arrayBuffer(),
          useWorker: true,
        }).promise;

        let pdfText = "";
        // Loop through all pages and extract text
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item) => item.str);
          pdfText += strings.join(" ") + "\n";
        }
        text = pdfText;
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        // Use mammoth for DOCX extraction in the browser
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({
          arrayBuffer: await file.arrayBuffer(),
        });
        text = result.value;
      } else if (file.type === "text/plain") {
        text = await file.text();
      }
      // Save the extracted text into context
      setDocumentText(text);
      alert(`Document loaded! Context will be used for future queries.`);
    } catch (error) {
      console.error("Document processing failed", error);
    }
  };

  const handleAudioInput = () => {
    const speechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!speechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }
    const recognition = new speechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  const loadPrompt = async (prompt) => {
    setRecentPrompt(prompt);
    await onSent(prompt);
  };

  return (
    <div className="flex font-['Outfit'] min-h-screen fadeIn-animation">
      {/* Sidebar */}
      <div className="hidden sm:block">
        {isOpen ? (
          <div className="flex flex-col h-screen bg-gray-100 p-4 w-16 sm:w-64">
            {/* Top Section */}
            <button
              className="text-3xl sm:text-4xl mb-6"
              onClick={() => setIsOpen(!isOpen)}
            >
              <IoReorderThree />
            </button>
            {/* Middle Section (New Chat) */}
            <button
              onClick={() => newChat()}
              className="text-base sm:text-xl flex items-center gap-2 bg-slate-200 py-2 px-4 rounded-2xl mb-6"
            >
              <FaPlus />
              <span className="hidden sm:inline">New Chat</span>
            </button>
            <div className="flex flex-col fadeIn-animation">
              <p className="mb-4">Recent</p>
              {prevPrompts.map((item, index) => (
                <div
                  key={index}
                  onClick={() => loadPrompt(item)}
                  className="flex items-center gap-1 bg-slate-200 rounded-2xl mb-1 cursor-pointer"
                >
                  <img
                    className="w-12 h-12 p-1"
                    src={assets.message_icon}
                    alt=""
                  />
                  <p>{item.slice(0, 18)} ...</p>
                </div>
              ))}
            </div>
            {/* Spacer */}
            <div className="flex-grow" />
            {/* Bottom Buttons */}
            <div className="text-xl sm:text-2xl flex flex-col items-center sm:items-start gap-4">
              <button className="flex items-center gap-2">
                <AiOutlineQuestionCircle />
                <span className="hidden sm:inline">Help</span>
              </button>
              <button className="flex items-center gap-2">
                <CiTimer />
                <span className="hidden sm:inline">Activity</span>
              </button>
              <button className="flex items-center gap-2">
                <IoSettingsOutline />
                <span className="hidden sm:inline">Settings</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-screen bg-gray-100 p-4 w-16">
            {/* Top Section */}
            <button
              className="text-3xl sm:text-4xl mb-8"
              onClick={() => setIsOpen(!isOpen)}
            >
              <IoReorderThree />
            </button>
            {/* Middle Section */}
            <button className="text-xl flex justify-center items-center bg-slate-200 py-2 px-2 h-10 w-10 rounded-full mb-4">
              <FaPlus />
            </button>
            <div className="flex-grow" />
            {/* Bottom Buttons */}
            <div className="text-xl flex flex-col items-center gap-4">
              <button className="flex items-center">
                <AiOutlineQuestionCircle />
              </button>
              <button className="flex items-center">
                <CiTimer />
              </button>
              <button className="flex items-center">
                <IoSettingsOutline />
              </button>
            </div>
          </div>
        )}

        {/* Main Section */}
      </div>
      <div className="flex-1 relative p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl sm:text-2xl text-[#585858]">Gemino</h1>
          <img
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
            src="/profile.jpg"
            alt="Profile"
          />
        </div>
        {!showResult ? (
          <>
            {/* Main Content Container */}
            <div className="relative max-w-[900px] mx-auto pb-28">
              <div className="mx-4 sm:mx-12 text-3xl sm:text-5xl text-[#c4c7c5] font-medium p-4 sm:p-6">
                <p>
                  <span className="bg-gradient-to-r from-[#4b90ff] to-[#ff5546] bg-clip-text text-transparent">
                    Hello, Dev.
                  </span>
                </p>
                <p className="mt-2 text-lg sm:text-xl">
                  How can we help you today?
                </p>
              </div>
              {/* Grid of Cards */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 sm:gap-6 p-4 sm:p-6">
                {/* Card 1 */}
                <div className="h-15 sm:h-[200px] p-4 bg-[#f0f4f9] rounded-lg sm:rounded-[10px] relative cursor-pointer hover:bg-[#dfe4ea]">
                  <p className="text-[#585858] text-sm">
                    Suggest beautiful places to see on an upcoming trip
                  </p>
                  <img
                    src={assets.compass_icon}
                    alt="Compass"
                    className="w-8 sm:w-[35px] p-1 sm:p-[5px] absolute bg-white rounded-full sm:rounded-[20px] bottom-2 right-2"
                  />
                </div>
                {/* Card 2 */}
                <div className="h-15 sm:h-[200px] p-4 bg-[#f0f4f9] rounded-lg sm:rounded-[10px] relative cursor-pointer hover:bg-[#dfe4ea]">
                  <p className="text-[#585858] text-sm">
                    Innovative ideas for an upcoming project
                  </p>
                  <img
                    src={assets.message_icon}
                    alt="Message"
                    className="w-8 sm:w-[35px] p-1 sm:p-[5px] absolute bg-white rounded-full sm:rounded-[20px] bottom-2 right-2"
                  />
                </div>
                {/* Card 3 */}
                <div className="h-15 sm:h-[200px] p-4 bg-[#f0f4f9] rounded-lg sm:rounded-[10px] relative cursor-pointer hover:bg-[#dfe4ea]">
                  <p className="text-[#585858] text-sm">
                    Understanding React hooks
                  </p>
                  <img
                    src={assets.bulb_icon}
                    alt="Bulb"
                    className="w-8 sm:w-[35px] p-1 sm:p-[5px] absolute bg-white rounded-full sm:rounded-[20px] bottom-2 right-2"
                  />
                </div>
                {/* Card 4 */}
                <div className="h-15 sm:h-[200px] p-4 bg-[#f0f4f9] rounded-lg sm:rounded-[10px] relative cursor-pointer hover:bg-[#dfe4ea]">
                  <p className="text-[#585858] text-sm">
                    Create a custom images gallery
                  </p>
                  <img
                    src={assets.code_icon}
                    alt="Code"
                    className="w-8 sm:w-[35px] p-1 sm:p-[5px] absolute bg-white rounded-full sm:rounded-[20px] bottom-2 right-2"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="px-0 py-[5%] max-h-[70vh] overflow-y-scroll scrollbar-hide">
            <div className="mx-[40px] my-0 flex items-center gap-[20px] ">
              <img
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                src="./profile.jpg"
                alt=""
              />
              <p>{recentPrompt}</p>
            </div>
            <div className="mx-[40px] my-0 flex items-start gap-[20px] mt-2">
              <img
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                src={assets.gemini_icon}
                alt=""
              />
              {loading ? (
                <div className="w-[100%] flex flex-col gap-[10px]">
                  <hr className="rounded-[4px] border-0 bg-[#f6f7f8] bg-gradient-to-r from-[#9ed7ff] via-[#ffffff] to-[#9ed7ff] bg-[length:800px_50px] h-[20px] loader-animation " />
                  <hr className="rounded-[4px] border-0 bg-[#f6f7f8] bg-gradient-to-r from-[#9ed7ff] via-[#ffffff] to-[#9ed7ff] bg-[length:800px_50px] h-[20px] loader-animation " />
                  <hr className="rounded-[4px] border-0 bg-[#f6f7f8] bg-gradient-to-r from-[#9ed7ff] via-[#ffffff] to-[#9ed7ff] bg-[length:800px_50px] h-[20px] loader-animation " />
                </div>
              ) : (
                <p
                  className=" text-[15px] sm:text-[17px] font-light leading-[1.8]"
                  dangerouslySetInnerHTML={{ __html: resultData }}
                ></p>
              )}
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div className="absolute inset-x-0 bottom-0 px-4 pb-6">
          <div className="flex items-center justify-between gap-4 bg-white/80 shadow-md backdrop-blur-lg px-4 py-3 rounded-full border-1 border-gray-200 mb-4">
            <input
              type="text"
              placeholder="Enter a prompt here"
              className="flex-1 bg-transparent border-none outline-none text-base sm:text-lg placeholder-gray-500"
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />
            <div className="flex items-center space-x-3">
              <input
                type="file"
                id="document-upload"
                hidden
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                    e.target.value = null; // Reset input
                  }
                }}
                accept=".pdf,.docx,.txt"
              />
              <label
                htmlFor="document-upload"
                className="cursor-pointer  rounded-full hover:bg-gray-100 transition-colors"
                title="Attach document"
              >
                <span className="text-xl">
                  <MdAttachFile />
                </span>
              </label>
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-white p-2 rounded-lg shadow-lg text-sm">
                Attach PDF/DOCX/TXT
              </div>
              <img
                src={assets.mic_icon}
                alt="Mic"
                className="w-6 h-6 cursor-pointer"
                onClick={handleAudioInput}
              />
              <img
                onClick={() => onSent()}
                src={assets.send_icon}
                alt="Send"
                className="w-6 h-6 cursor-pointer"
              />
            </div>
          </div>
          <p className="mt-2 text-center text-xs sm:text-sm text-gray-500">
            Gemini may produce inaccurate information about people, places, or
            facts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
