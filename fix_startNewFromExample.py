import codecs

with codecs.open('js/app.js', 'r', 'utf-8-sig') as f:
    content = f.read()

# Replace openUseExampleModal
old_modal = "function openUseExampleModal(ex) {"
new_modal = "function openUseExampleModal(ex) {\n    state.activeExternalExample = ex;"
content = content.replace(old_modal, new_modal)

# Replace startNewFromExample
old_start = "function startNewFromExample(typeId, exId) {\n    const ex = storage.getExampleById(exId);"
new_start = "function startNewFromExample(typeId, exId) {\n    let ex = storage.getExampleById(exId);\n    if (!ex && state.activeExternalExample && state.activeExternalExample.id === exId) ex = state.activeExternalExample;"
content = content.replace(old_start, new_start)

with codecs.open('js/app.js', 'w', 'utf-8-sig') as f:
    f.write(content)

print("DONE")
