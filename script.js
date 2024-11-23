document.getElementById("analyze-btn").addEventListener("click", function () {
    const fileInput = document.getElementById("resume");
    const jobDescInput = document.getElementById("job-desc").value;

    if (fileInput.files.length === 0 || !jobDescInput) {
        alert("Please upload a resume and enter a job description.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async function () {
        const typedarray = new Uint8Array(this.result);
        const text = await extractTextFromPDF(typedarray);

        const jobKeywords = extractKeywords(jobDescInput);
        const resumeKeywords = extractKeywords(text);

        const { matchedKeywords, missingKeywords } = matchAndCheckKeywords(resumeKeywords, jobKeywords);
        const score = fitScore(matchedKeywords.length, jobKeywords.length);

        displayResults(score, matchedKeywords, missingKeywords);
    };

    reader.readAsArrayBuffer(file);
});

// Extracts text from the PDF file using pdf.js
async function extractTextFromPDF(pdfData) {
    const pdf = await pdfjsLib.getDocument(pdfData).promise;
    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const text = await page.getTextContent();
        text.items.forEach((item) => {
            fullText += item.str + " ";
        });
    }
    return fullText.trim(); // Trim any excess whitespace
}

// Tokenizes text, removes stopwords, and returns keywords
function extractKeywords(text) {
    const stopwords = new Set([
        "and", "the", "is", "in", "to", "with", "a", "for", "of", "on", "at", "by"
    ]);

    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const filteredWords = [];
    for (const word of words) {
        if (word && !stopwords.has(word)) {
            filteredWords.push(word);
        }
    }
    return filteredWords;
}

// Matches job keywords to resume keywords
function matchAndCheckKeywords(resumeKeywords, jobKeywords) {
    const matchedKeywords = [];
    const missingKeywords = [];

    for (const keyword of jobKeywords) {
        if (resumeKeywords.includes(keyword)) {
            matchedKeywords.push(keyword);
        } else {
            missingKeywords.push(keyword);
        }
    }

    return { matchedKeywords, missingKeywords };
}

// Calculates the fit score
function fitScore(matchedCount, totalKeywords) {
    if (totalKeywords > 0) {
        return (matchedCount / totalKeywords) * 100;
    } else {
        return 0;
    }
}

// Displays the analysis results
function displayResults(score, matchedKeywords, missingKeywords) {
    // Update the score text
    const scoreText = document.getElementById("score-text");
    scoreText.textContent = score.toFixed(2) + "%";

    // Calculate degrees for the circular progress
    const degrees = (score / 100) * 360; // Convert score to degrees (0 to 360)
    
    // Update CSS variable for progress circle
    const scoreCircle = document.getElementById("score-circle");
    scoreCircle.style.background = `conic-gradient(#5cb85c ${degrees}deg, #e0e0e0 ${100 - degrees}deg)`;

    // Display matched keywords
    const matchedKeywordsSection = document.getElementById("matched-keywords-list");
    matchedKeywordsSection.textContent = matchedKeywords.length > 0 ? matchedKeywords.join(', ') : "None";
    if (matchedKeywords.length > 5) {
        matchedKeywordsSection.textContent = matchedKeywords.slice(0, 5).join(', ') + '...'; // Show first 5 matched keywords and ellipsis
    }

    // Display missing keywords
    const missingKeywordsSection = document.getElementById("missing-keywords-list");
    missingKeywordsSection.textContent = missingKeywords.length > 0 ? missingKeywords.join(', ') : "None";
    if (missingKeywords.length > 5) {
        missingKeywordsSection.textContent = missingKeywords.slice(0, 5).join(', ') + '...'; // Show first 5 missing keywords and ellipsis
    }

    document.getElementById("popup").style.display = "block";
}


// Closes the popup when the button is clicked
document.querySelector(".close-popup").addEventListener("click", function() {
    document.getElementById("popup").style.display = "none";
});

// Close the popup when clicking outside of the popup content
window.addEventListener("click", function(event) {
    const popup = document.getElementById("popup");
    if (event.target === popup) {
        popup.style.display = "none";
    }
});
