const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');

// Configure multer for document uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../public/uploads/documents');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (err) {
            console.error('Error creating upload directory:', err);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 500 * 1024 * 1024, // 500MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        console.log('Receiving file:', file.originalname, 'mimetype:', file.mimetype);
        
        const allowedExtensions = ['.docx', '.pdf'];
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/pdf'
        ];
        
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            console.error('File type not allowed:', ext, file.mimetype);
            cb(new Error('Only DOCX and PDF files are allowed'));
        }
    }
});

/**
 * Extract and save images from document
 */
async function extractImages(buffer, fileType, originalName) {
    const images = [];
    
    try {
        if (fileType === '.docx') {
            // Extract images from DOCX
            const result = await mammoth.convertToHtml({ buffer: buffer }, {
                convertImage: mammoth.images.imgElement(async (image) => {
                    try {
                        const imageBuffer = await image.read();
                        const extension = image.contentType.split('/')[1] || 'png';
                        const imageName = `${uuidv4()}.${extension}`;
                        const imagePath = path.join(__dirname, '../../public/uploads/images', imageName);
                        
                        await fs.writeFile(imagePath, imageBuffer);
                        images.push(`/uploads/images/${imageName}`);
                        
                        return {
                            src: `/uploads/images/${imageName}`
                        };
                    } catch (err) {
                        console.error('Error extracting image:', err);
                        return { src: '' };
                    }
                })
            });
            return { images, html: result.value };
        }
    } catch (err) {
        console.error('Error in extractImages:', err);
    }
    
    return { images, html: null };
}

/**
 * Detect and preserve mathematical formulas
 * Supports: LaTeX, MathML, Unicode math symbols
 */
function detectMathFormulas(text) {
    // Common math patterns
    const mathPatterns = [
        /\$\$(.+?)\$\$/g,  // LaTeX display mode
        /\$(.+?)\$/g,      // LaTeX inline mode
        /\\[a-zA-Z]+\{[^}]*\}/g,  // LaTeX commands
        /[∫∑∏√∞≤≥≠±×÷∈∉⊂⊃∩∪∧∨¬∀∃]/g,  // Unicode math symbols
        /[α-ωΑ-Ω]/g,       // Greek letters
        /\^\{[^}]+\}|_\{[^}]+\}/g,  // Superscript/subscript
        /\\frac\{[^}]+\}\{[^}]+\}/g,  // Fractions
    ];
    
    let hasMath = false;
    for (const pattern of mathPatterns) {
        if (pattern.test(text)) {
            hasMath = true;
            break;
        }
    }
    
    return hasMath;
}

/**
 * Clean and preserve mathematical notation
 */
function preserveMathNotation(text) {
    // Preserve LaTeX notation
    text = text.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
    text = text.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
    
    // Preserve common formulas
    text = text.replace(/(\d+)\^(\d+)/g, '$1^{$2}');  // Exponents
    text = text.replace(/(\w+)_(\d+)/g, '$1_{$2}');    // Subscripts
    
    return text;
}

/**
 * Parse text content and extract questions
 * Enhanced to handle:
 * 1. Mathematical formulas (LaTeX, Unicode)
 * 2. Images references
 * 3. Complex formatting
 * 4. Multiple question types
 */
function parseQuestionsFromText(text, extractedImages = []) {
    const questions = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentQuestion = null;
    let currentOptions = [];
    let currentAnswer = null;
    let questionText = '';
    let questionImages = [];
    let hasFormulas = false;
    
    // Enhanced patterns to detect questions and answers
    // Supports: "1. ", "Câu 1:", "Question 1)", "Q1.", etc.
    const questionPattern = /^(?:(?:Câu|Question|Q)\s*)?(\d+)[.:)]\s*(.+)/i;
    // Supports: "A. ", "A) ", "A: ", etc.
    const optionPattern = /^([A-D])[.:)]\s*(.+)/i;
    // Supports: "Answer: B", "Đáp án: B", "Correct Answer: B"
    const answerPattern = /^(?:Answer|Đáp án|Correct\s*Answer|Trả\s*lời)[:\s]+([A-D])/i;
    const imagePattern = /\[(?:Image|Hình|Ảnh)\s*(\d+)\]|<img[^>]*>/i;
    const multipleChoiceMarker = /trắc nghiệm|multiple choice|lựa chọn/i;
    const essayMarker = /tự luận|essay|short answer/i;
    
    console.log('Starting question parsing...');
    console.log('Total lines to process:', lines.length);
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if this is a new question
        const questionMatch = line.match(questionPattern);
        if (questionMatch) {
            console.log(`Found question #${questionMatch[1]}: ${line.substring(0, 50)}...`);
            
            // Save previous question if exists
            if (currentQuestion) {
                const preservedText = preserveMathNotation(questionText || currentQuestion);
                questions.push({
                    question_text: preservedText,
                    question_type: currentOptions.length > 0 ? 'multiple_choice_single' : 'essay',
                    options: currentOptions.length > 0 ? currentOptions.map(opt => preserveMathNotation(opt)) : [],
                    correct_answer: currentAnswer !== null ? currentAnswer : 0,
                    explanation: '',
                    image_url: questionImages.length > 0 ? questionImages[0] : null,
                    has_math: hasFormulas
                });
                console.log(`Saved question with ${currentOptions.length} options, answer: ${currentAnswer}`);
            }
            
            // Start new question
            questionText = questionMatch[2];
            currentQuestion = questionMatch[2];
            currentOptions = [];
            currentAnswer = null;
            questionImages = [];
            hasFormulas = detectMathFormulas(questionMatch[2]);
            continue;
        }
        
        // Check for image references
        const imageMatch = line.match(imagePattern);
        if (imageMatch && currentQuestion) {
            // Try to map to extracted images
            if (extractedImages.length > questionImages.length) {
                questionImages.push(extractedImages[questionImages.length]);
            }
            console.log(`Found image reference for current question`);
            continue;
        }
        
        // Check if this is an option
        const optionMatch = line.match(optionPattern);
        if (optionMatch && currentQuestion) {
            const optionLetter = optionMatch[1].toUpperCase();
            const optionText = optionMatch[2];
            currentOptions.push(optionText);
            console.log(`  Option ${optionLetter}: ${optionText.substring(0, 30)}...`);
            
            // Check if option has formulas
            if (detectMathFormulas(optionText)) {
                hasFormulas = true;
            }
            continue;
        }
        
        // Check if this is an answer
        const answerMatch = line.match(answerPattern);
        if (answerMatch && currentQuestion) {
            const answerLetter = answerMatch[1].toUpperCase();
            currentAnswer = answerLetter.charCodeAt(0) - 'A'.charCodeAt(0);
            console.log(`  Correct answer: ${answerLetter} (index: ${currentAnswer})`);
            continue;
        }
        
        // If not a pattern match, it might be continuation of question text
        if (currentQuestion && currentOptions.length === 0 && !line.match(/^[A-D][.:)]/)) {
            questionText += ' ' + line;
            
            // Check if continuation has formulas
            if (detectMathFormulas(line)) {
                hasFormulas = true;
            }
        }
    }
    
    // Add the last question
    if (currentQuestion) {
        const preservedText = preserveMathNotation(questionText || currentQuestion);
        questions.push({
            question_text: preservedText,
            question_type: currentOptions.length > 0 ? 'multiple_choice_single' : 'essay',
            options: currentOptions.length > 0 ? currentOptions.map(opt => preserveMathNotation(opt)) : [],
            correct_answer: currentAnswer !== null ? currentAnswer : 0,
            explanation: '',
            image_url: questionImages.length > 0 ? questionImages[0] : null,
            has_math: hasFormulas
        });
        console.log(`Saved last question with ${currentOptions.length} options`);
    }
    
    console.log(`Total questions parsed: ${questions.length}`);
    return questions;
}

/**
 * Extract exam metadata from text
 */
function extractExamMetadata(text) {
    const metadata = {
        title: '',
        subject: '',
        grade_level: '',
        description: '',
        duration: 60
    };
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Try to detect title from first line if it's not a question
    if (lines.length > 0) {
        const firstLine = lines[0];
        // If first line doesn't start with a number (not a question), use it as title
        if (firstLine.length > 5 && !firstLine.match(/^\d+[.:)]/)) {
            metadata.title = firstLine;
            
            // Try to extract subject from title
            const subjectMatch = firstLine.match(/^(\w+)\s+(?:TEST|ĐỀ THI|KIỂM TRA)/i);
            if (subjectMatch) {
                metadata.subject = subjectMatch[1];
            }
            
            // Try to extract question count for description
            const countMatch = firstLine.match(/(\d+)\s+(?:QUESTIONS|MULTIPLE-CHOICE|CÂU)/i);
            if (countMatch) {
                metadata.description = `Contains ${countMatch[1]} questions`;
            }
        }
    }
    
    // Try to extract title (usually first few lines)
    const titlePattern = /^(?:Title|Tiêu đề|Tên bài thi)[:\s]+(.+)/i;
    const subjectPattern = /^(?:Subject|Môn học)[:\s]+(.+)/i;
    const gradePattern = /^(?:Grade|Lớp|Cấp)[:\s]+(.+)/i;
    const durationPattern = /^(?:Duration|Thời gian)[:\s]+(\d+)/i;
    
    for (const line of lines.slice(0, 10)) { // Check first 10 lines for metadata
        if (titlePattern.test(line)) {
            metadata.title = line.match(titlePattern)[1];
        } else if (subjectPattern.test(line)) {
            metadata.subject = line.match(subjectPattern)[1];
        } else if (gradePattern.test(line)) {
            metadata.grade_level = line.match(gradePattern)[1];
        } else if (durationPattern.test(line)) {
            metadata.duration = parseInt(line.match(durationPattern)[1]);
        }
    }
    
    return metadata;
}

const documentParserController = {
    upload: upload.single('file'),
    
    parseDocument: async (req, res) => {
        console.log('\n=== Starting document parsing ===');
        
        try {
            if (!req.file) {
                console.error('No file received in request');
                return res.status(400).json({ error: 'No file uploaded' });
            }
            
            console.log('File received:', {
                originalName: req.file.originalname,
                filename: req.file.filename,
                path: req.file.path,
                size: req.file.size,
                mimetype: req.file.mimetype
            });
            
            const filePath = req.file.path;
            const fileExtension = path.extname(req.file.originalname).toLowerCase();
            
            // Check if file exists
            try {
                await fs.access(filePath);
                console.log('File exists and is accessible');
            } catch (err) {
                console.error('File not accessible:', err);
                return res.status(500).json({ error: 'Uploaded file not accessible' });
            }
            
            let textContent = '';
            let extractedImages = [];
            let htmlContent = null;
            
            try {
                // Ensure images directory exists
                const imagesDir = path.join(__dirname, '../../public/uploads/images');
                await fs.mkdir(imagesDir, { recursive: true });
                console.log('Images directory ready:', imagesDir);
                
                if (fileExtension === '.docx' || req.file.mimetype.includes('word')) {
                    console.log('Processing DOCX file...');
                    
                    try {
                        // Read file buffer for image extraction
                        const buffer = await fs.readFile(filePath);
                        console.log('File buffer read, size:', buffer.length, 'bytes');
                        
                        // Extract images and HTML
                        console.log('Extracting images...');
                        const imageResult = await extractImages(buffer, fileExtension, req.file.originalname);
                        extractedImages = imageResult.images;
                        htmlContent = imageResult.html;
                        console.log(`Extracted ${extractedImages.length} images from DOCX`);
                        
                        // Also extract raw text for parsing
                        console.log('Extracting raw text...');
                        const result = await mammoth.extractRawText({ path: filePath });
                        textContent = result.value;
                        console.log('Text extracted, length:', textContent.length, 'characters');
                        
                        if (!textContent || textContent.trim().length === 0) {
                            console.warn('No text content extracted from DOCX');
                        } else {
                            console.log('First 200 chars:', textContent.substring(0, 200));
                        }
                    } catch (docxError) {
                        console.error('Error processing DOCX:', docxError);
                        throw new Error(`Failed to process DOCX file: ${docxError.message}`);
                    }
                } else if (fileExtension === '.pdf' || req.file.mimetype === 'application/pdf') {
                    // Parse PDF file (note: PDF image extraction is more complex)
                    const dataBuffer = await fs.readFile(filePath);
                    const pdfData = await pdfParse(dataBuffer);
                    textContent = pdfData.text;
                    
                    // Note: Advanced PDF image extraction would require additional libraries
                    console.log('PDF parsed. Note: Image extraction from PDF requires additional setup.');
                } else {
                    return res.status(400).json({ error: 'Unsupported file format' });
                }
                
                // Extract metadata and questions
                console.log('Extracting metadata...');
                const metadata = extractExamMetadata(textContent);
                console.log('Metadata:', metadata);
                
                console.log('\n=== DEBUG: Sample lines for parsing ===');
                const sampleLines = textContent.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .slice(0, 20);
                
                sampleLines.forEach((line, idx) => {
                    console.log(`Line ${idx}: "${line}"`);
                });
                console.log('=== END DEBUG SAMPLE ===\n');
                
                console.log('Parsing questions from text...');
                const questions = parseQuestionsFromText(textContent, extractedImages);
                console.log(`Parsed ${questions.length} questions`);
                
                if (questions.length === 0) {
                    console.warn('No questions found! Check file format.');
                    console.log('Sample text (first 500 chars):', textContent.substring(0, 500));
                }
                
                // Count questions with math formulas
                const mathQuestions = questions.filter(q => q.has_math).length;
                const imageQuestions = questions.filter(q => q.image_url).length;
                console.log('Stats - Math:', mathQuestions, 'Images:', imageQuestions);
                
                // Clean up uploaded file
                await fs.unlink(filePath).catch(err => console.error('Error deleting file:', err));
                
                // Return parsed data with additional info
                res.json({
                    ...metadata,
                    questions: questions.map(q => {
                        const { has_math, ...questionData } = q;
                        return questionData;
                    }),
                    message: `Successfully parsed ${questions.length} questions`,
                    stats: {
                        total_questions: questions.length,
                        math_questions: mathQuestions,
                        image_questions: imageQuestions,
                        extracted_images: extractedImages.length
                    }
                });
                
            } catch (parseError) {
                console.error('Parse error:', parseError);
                console.error('Stack trace:', parseError.stack);
                // Clean up file on error
                await fs.unlink(filePath).catch(err => console.error('Error deleting file:', err));
                throw parseError;
            }
            
        } catch (error) {
            console.error('\n=== Document parsing error ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Stack trace:', error.stack);
            
            let errorMessage = 'Failed to parse document.';
            let errorDetails = error.message;
            
            if (error.message.includes('DOCX')) {
                errorMessage = 'Không thể đọc file DOCX. File có thể bị hỏng hoặc có mật khẩu bảo vệ.';
            } else if (error.message.includes('PDF')) {
                errorMessage = 'Không thể đọc file PDF. File có thể bị hỏng hoặc có mật khẩu bảo vệ.';
            } else if (error.code === 'ENOENT') {
                errorMessage = 'Không tìm thấy file. Vui lòng thử lại.';
            } else if (error.code === 'LIMIT_FILE_SIZE') {
                errorMessage = 'File quá lớn. Kích thước tối đa là 500MB.';
            }
            
            res.status(500).json({ 
                error: errorMessage,
                details: errorDetails,
                suggestion: 'Vui lòng kiểm tra file có đúng định dạng DOCX/PDF không bị hỏng và không có mật khẩu bảo vệ.'
            });
        }
    }
};

module.exports = documentParserController;
