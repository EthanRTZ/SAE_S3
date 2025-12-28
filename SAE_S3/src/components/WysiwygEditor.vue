<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  height: {
    type: Number,
    default: 400
  },
  placeholder: {
    type: String,
    default: 'Rédigez votre contenu ici...'
  }
})

const emit = defineEmits(['update:modelValue'])

const editorId = ref(`wysiwyg-${Math.random().toString(36).substr(2, 9)}`)
let editorInstance = null
let isInternalUpdate = false

// Clé API TinyMCE
const TINYMCE_API_KEY = 'b25zghivmcfp9xxkc3awneitl1ujlu2ejfz4mbb2zxlspwdm'

const initEditor = () => {
  if (typeof window.tinymce === 'undefined') {
    console.error('TinyMCE not loaded')
    return
  }

  window.tinymce.init({
    selector: `#${editorId.value}`,
    height: props.height,
    menubar: true,
    language: 'fr_FR',
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons'
    ],
    toolbar: 'undo redo | styles | bold italic underline forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media emoticons | removeformat code fullscreen | help',
    toolbar_mode: 'sliding',
    content_style: `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        font-size: 14px;
        color: #ffffff;
        background-color: #1a1a2e;
        line-height: 1.6;
        padding: 12px;
      }
      img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; }
      p { margin-bottom: 12px; color: #ffffff; }
      h1, h2, h3 { margin: 16px 0 8px; color: #FCDC1E; }
      a { color: #64B5F6; }
      ul, ol { margin-left: 24px; margin-bottom: 12px; color: #ffffff; }
      strong { color: #FCDC1E; }
      em { color: rgba(255, 255, 255, 0.9); }
    `,
    skin: 'oxide-dark',
    content_css: 'dark',
    placeholder: props.placeholder,
    images_upload_handler: (blobInfo, progress) => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(blobInfo.blob())
      reader.onloadend = () => {
        resolve(reader.result)
      }
      reader.onerror = () => {
        reject('Erreur lors du chargement de l\'image')
      }
    }),
    file_picker_types: 'image',
    file_picker_callback: (callback, value, meta) => {
      if (meta.filetype === 'image') {
        const input = document.createElement('input')
        input.setAttribute('type', 'file')
        input.setAttribute('accept', 'image/*')
        input.onchange = function () {
          const file = this.files[0]
          const reader = new FileReader()
          reader.onload = function () {
            callback(reader.result, { alt: file.name })
          }
          reader.readAsDataURL(file)
        }
        input.click()
      }
    },
    setup: (editor) => {
      editorInstance = editor

      editor.on('init', () => {
        if (props.modelValue) {
          editor.setContent(props.modelValue)
        }
      })

      editor.on('change keyup input', () => {
        if (isInternalUpdate) return
        const content = editor.getContent()
        emit('update:modelValue', content)
      })
    },
    promotion: false,
    branding: false
  })
}

const loadTinyMCE = () => {
  // Vérifier si déjà chargé
  if (typeof window.tinymce !== 'undefined') {
    initEditor()
    return
  }

  // Charger TinyMCE depuis CDN avec la clé API
  const script = document.createElement('script')
  script.src = `https://cdn.tiny.cloud/1/${TINYMCE_API_KEY}/tinymce/6/tinymce.min.js`
  script.referrerPolicy = 'origin'
  script.onload = () => {
    // Charger le pack de langue français
    const langScript = document.createElement('script')
    langScript.src = `https://cdn.tiny.cloud/1/${TINYMCE_API_KEY}/tinymce/6/langs/fr_FR.js`
    langScript.onload = () => initEditor()
    langScript.onerror = () => initEditor() // Continue même si la langue ne charge pas
    document.head.appendChild(langScript)
  }
  script.onerror = () => {
    console.error('Erreur de chargement de TinyMCE')
  }
  document.head.appendChild(script)
}

watch(() => props.modelValue, (newValue) => {
  if (editorInstance && editorInstance.getContent() !== newValue) {
    isInternalUpdate = true
    editorInstance.setContent(newValue || '')
    isInternalUpdate = false
  }
})

onMounted(() => {
  loadTinyMCE()
})

onBeforeUnmount(() => {
  if (editorInstance) {
    editorInstance.remove()
    editorInstance = null
  }
})
</script>

<template>
  <div class="wysiwyg-editor-wrapper">
    <textarea :id="editorId" class="wysiwyg-fallback"></textarea>
  </div>
</template>

<style scoped>
.wysiwyg-editor-wrapper {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.wysiwyg-fallback {
  width: 100%;
  min-height: 300px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
}
</style>

