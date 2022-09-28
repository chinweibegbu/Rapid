import { t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { uiSection } from '../section';


export function uiSectionMapStyleOptions(context) {

  let section = uiSection('fill-area', context)
      .label(t.html('map_data.style_options'))
      .disclosureContent(renderDisclosureContent)
      .expandedByDefault(false);


  function renderDisclosureContent(selection) {
    let container = selection.selectAll('.layer-fill-list')
      .data([0]);

    container.enter()
      .append('ul')
      .attr('class', 'layer-list layer-fill-list')
      .merge(container)
      .call(drawListItems, context.map().areaFillOptions, 'radio', 'area_fill', setFill, isActiveFill);

    let container2 = selection.selectAll('.layer-visual-diff-list')
      .data([0]);

    container2.enter()
      .append('ul')
      .attr('class', 'layer-list layer-visual-diff-list')
      .merge(container2)
      .call(drawListItems, ['highlight_edits'], 'checkbox', 'visual_diff', setHighlighted, isHighlightChecked);
  }


  function drawListItems(selection, data, type, name, change, active) {
    let items = selection.selectAll('li')
      .data(data);

    // Exit
    items.exit()
      .remove();

    // Enter
    let enter = items.enter()
      .append('li')
      .call(uiTooltip()
        .title(d => t.html(`${name}.${d}.tooltip`))
        .keys(d => {
          let key = (d === 'wireframe' ? t('area_fill.wireframe.key') : null);
          if (d === 'highlight_edits') {
            key = t('map_data.highlight_edits.key');
          }
          return key ? [key] : null;
        })
        .placement('top')
      );

    let label = enter
      .append('label');

    label
      .append('input')
      .attr('type', type)
      .attr('name', name)
      .on('change', change);

    label
      .append('span')
      .html(d => t.html(`${name}.${d}.description`));

    // Update
    items = items
      .merge(enter);

    items
      .classed('active', active)
      .selectAll('input')
      .property('checked', active)
      .property('indeterminate', false);
  }


  function isActiveFill(d) {
    return context.map().areaFillMode === d;
  }

  function setFill(d3_event, d) {
    context.map().areaFillMode = d;
  }

  function isHighlightChecked() {
    return context.map().highlightEdits;
  }

  function setHighlighted(d3_event) {
    const input = d3_event.currentTarget;
    context.map().highlightEdits = input.checked;
  }


  context.map().on('optionchange', section.reRender);

  return section;
}
