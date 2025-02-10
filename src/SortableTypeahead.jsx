/**
 * @fileoverview Item which be dragged/dropped.
 * @author Bob Kline
 * @date 2024-11-20
 */
import React, { useState, useEffect } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,

  arrayMove,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Token, Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';

// Custom value which can be selected and sorted.
const SortableItem = (props) => {

  // Support for drag-and-drop sorting.
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: props.option.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Token option={props.option} onRemove={props.onRemove}>
        {props.option.label}
      </Token>
    </div>
  );
};

// Field for picking and sorting values.
const SortableTypeahead = (props) => {

  // Note which options start out pre-selected.
  const [selected, setSelected] = useState(
    props.selected.map(id => props.options.find(option => option.id === id))
  );

  useEffect(() => {
    setSelected(props.selected.map(id =>
      props.options.find(option => option.id === id))
    );
  }, [props.selected, props.options]);

  // Prevent the drag-and-drop sorting listener from hogging all the events.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  // When the drag operation completes, set the new positions.
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const activeIndex = selected.findIndex((item) => item.id === active.id);
    const overIndex = selected.findIndex((item) => item.id === over.id);
    if (activeIndex !== overIndex) {
      const newSelected = arrayMove(selected, activeIndex, overIndex);
      setSelected(newSelected);
      props.setSelected(newSelected.map(item => item.id));
    }
  };

  // Keep track of which values are available for sorting.
  const handleSelectionChange = (selectedItems) => {
    setSelected(selectedItems);
    props.setSelected(selectedItems.map(item => item.id));
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext
        items={selected}
        strategy={horizontalListSortingStrategy}
      >
        <Typeahead
          id={props.id}
          inputProps={{ 'testid': props.id }}
          options={props.options}
          selected={selected}
          onChange={handleSelectionChange}
          clearButton
          placeholder={props.placeholder}
          required={props.required ?? false}
          isInvalid={props.isInvalid}
          multiple
          renderToken={(opt, { onRemove }, index) => (
            <SortableItem
              key={index}
              option={opt}
              onRemove={(o) => { onRemove(o); }}
            />
          )}
        />
      </SortableContext>
    </DndContext>
  );
};

export default SortableTypeahead;
