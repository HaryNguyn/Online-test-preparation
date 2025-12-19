import { useEffect, useRef } from 'react'

interface MathRendererProps {
  content: string
  className?: string
  inline?: boolean
}

/**
 * Component to render mathematical formulas
 * Supports LaTeX notation: $...$ for inline, $$...$$ for display
 * Falls back to plain text if no math library is loaded
 */
export function MathRenderer({ content, className = '', inline = false }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Check if MathJax or KaTeX is available
    const renderMath = () => {
      // @ts-ignore - MathJax might be loaded globally
      if (typeof window.MathJax !== 'undefined') {
        // @ts-ignore
        window.MathJax.typesetPromise?.([containerRef.current]).catch((err: any) => {
          console.warn('MathJax rendering failed:', err)
        })
      }
      // @ts-ignore - KaTeX might be loaded globally
      else if (typeof window.katex !== 'undefined' && containerRef.current) {
        try {
          const mathElements = containerRef.current.querySelectorAll('.math')
          mathElements.forEach((element) => {
            const formula = element.textContent || ''
            // @ts-ignore
            window.katex.render(formula, element, {
              throwOnError: false,
              displayMode: !inline
            })
          })
        } catch (err) {
          console.warn('KaTeX rendering failed:', err)
        }
      }
    }

    renderMath()
  }, [content, inline])

  // Process content to wrap LaTeX notation
  const processContent = (text: string) => {
    // Replace $$...$$ with display math
    text = text.replace(/\$\$(.*?)\$\$/g, '<div class="math display">$1</div>')
    // Replace $...$ with inline math
    text = text.replace(/\$(.*?)\$/g, '<span class="math inline">$1</span>')
    
    return text
  }

  return (
    <div 
      ref={containerRef}
      className={`math-content ${className}`}
      dangerouslySetInnerHTML={{ __html: processContent(content) }}
    />
  )
}

/**
 * Simple text renderer that highlights potential math content
 * Use this when math libraries are not loaded
 */
export function MathText({ content, className = '' }: { content: string; className?: string }) {
  // Highlight LaTeX notation
  const highlightMath = (text: string) => {
    return text
      .replace(/\$\$(.*?)\$\$/g, '<span class="font-mono text-blue-600 dark:text-blue-400">$$$$1$$</span>')
      .replace(/\$(.*?)\$/g, '<span class="font-mono text-blue-600 dark:text-blue-400">$$$1$$</span>')
  }

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: highlightMath(content) }}
    />
  )
}
