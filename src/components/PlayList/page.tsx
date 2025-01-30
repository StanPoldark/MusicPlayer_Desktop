import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { List, Button } from 'antd';
import { Trash } from 'lucide-react';
import { useAppSelector, useAppDispatch } from "@/hooks/hooks";
import { 
  removeTrackFromPlaylist, 
  reorderPlaylist,
} from '@/redux/modules/musicPlayer/reducer';
import { Track } from '@/redux/modules/types';

interface SortableItemProps {
  track: Track;
  onRemove: (trackId: number) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ track, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <List.Item
        className="cursor-move p-2"
        style={{ paddingInlineStart: 20 }}
        extra={
          <Button 
            type="link" 
            onClick={() => onRemove(track.id)} 
            icon={<Trash className="w-4 h-4" />}
            className="text-neutral-400 hover:text-red-500"
            aria-label="Remove from playlist"
          />
        }
      >
        <div {...listeners} className="w-full">
          <List.Item.Meta
            title={
              <p className="text-white m-0 text-base">
                {track.name}
              </p>
            }
          />
        </div>
      </List.Item>
    </div>
  );
};

const PlaylistManager = () => {
  const dispatch = useAppDispatch();
  const { playlist } = useAppSelector(state => state.musicPlayer);
  const trackIds = playlist.map(track => track.id);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = playlist.findIndex(t => t.id === active.id);
      const newIndex = playlist.findIndex(t => t.id === over.id);
      
      dispatch(reorderPlaylist({
        sourceIndex: oldIndex,
        destinationIndex: newIndex
      }));
    }
  };

  const handleRemoveTrack = (trackId: number) => {
    dispatch(removeTrackFromPlaylist(trackId));
  };

  return (
    <div className="flex-1 p-4 bg-transparent rounded-lg w-full h-full">
      <h2 className="text-white text-xl mb-4">Playlist</h2>
      
      {playlist.length === 0 ? (
        <p className="text-neutral-500 text-center">Your playlist is empty</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext 
            items={trackIds}
            strategy={verticalListSortingStrategy}
          >
            <List
              itemLayout="horizontal"
              dataSource={playlist}
              renderItem={(track) => (
                <SortableItem 
                  key={track.id} 
                  track={track}
                  onRemove={handleRemoveTrack}
                />
              )}
            />
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default PlaylistManager;