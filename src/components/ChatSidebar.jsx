// [DEBUG] chats come from: useChatStore().chats
// [DEBUG] currentChatId comes from: useChatStore().currentChatId
// [DEBUG] selectChat is called here: onSelect handler in ChatItem

import { useState, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlusCircle, Pin, MoreVertical, Edit3, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

/**
 * Chat Sidebar Component with CRUD, Pin, and Drag & Drop
 */
const ChatSidebar = () => {
  const {
    chats,
    activeChatId,
    currentChatId,
    loading,
    firestoreError,
    loadChatsFromFirestore,
    createChat,
    selectChat,
    renameChat,
    deleteChat,
    pinChat,
    moveChat,
    reorderChat, // Keep for drag & drop
  } = useChatStore();

  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpenId && !e.target.closest('.chat-item-menu')) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpenId]);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load chats on mount
  useEffect(() => {
    loadChatsFromFirestore();
  }, [loadChatsFromFirestore]);

  // Auto-select first chat if none selected
  useEffect(() => {
    const chatIdToUse = currentChatId || activeChatId;
    if (!chatIdToUse && chats.length > 0) {
      selectChat(chats[0].id);
    }
  }, [chats, currentChatId, activeChatId, selectChat]);

  const handleCreateNewChat = async () => {
    try {
      await createChat();
      setMenuOpenId(null);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleRename = async (chatId, currentTitle) => {
    console.log('[SIDEBAR] Rename', chatId, editTitle.trim());
    if (editTitle.trim() && editTitle !== currentTitle) {
      try {
        await renameChat(chatId, editTitle.trim());
      } catch (error) {
        console.error('Error renaming chat:', error);
      }
    }
    setEditingChatId(null);
    setEditTitle('');
  };

  const handleDelete = async (chatId) => {
    console.log('[SIDEBAR] Delete', chatId);
    if (window.confirm('Sei sicuro di voler eliminare questa chat?')) {
      try {
        await deleteChat(chatId);
      } catch (error) {
        console.error('Error deleting chat:', error);
        alert(error.message || 'Errore durante l\'eliminazione');
      }
    }
    setMenuOpenId(null);
  };

  const handleTogglePin = async (chatId) => {
    console.log('[SIDEBAR] Pin/Unpin', chatId);
    try {
      await pinChat(chatId);
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert(error.message || 'Errore durante il pin/unpin');
    }
    setMenuOpenId(null);
  };

  const handleMoveUp = async (chatId) => {
    console.log('[SIDEBAR] Move up', chatId);
    try {
      await moveChat(chatId, 'up');
    } catch (error) {
      console.error('Error moving chat up:', error);
    }
    setMenuOpenId(null);
  };

  const handleMoveDown = async (chatId) => {
    console.log('[SIDEBAR] Move down', chatId);
    try {
      await moveChat(chatId, 'down');
    } catch (error) {
      console.error('Error moving chat down:', error);
    }
    setMenuOpenId(null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Only allow reordering unpinned chats
    const unpinnedChats = chats.filter(c => !c.pinned);
    const activeChat = unpinnedChats.find(c => c.id === active.id);
    const overChat = unpinnedChats.find(c => c.id === over.id);

    if (!activeChat || !overChat) {
      return; // Can't drag pinned chats
    }

    const oldIndex = unpinnedChats.findIndex(c => c.id === active.id);
    const newIndex = unpinnedChats.findIndex(c => c.id === over.id);

    const newOrder = arrayMove(unpinnedChats, oldIndex, newIndex);
    const newOrderIds = newOrder.map(c => c.id);
    
    // Use reorderChats from store (it's still available)
    const { reorderChats } = useChatStore.getState();
    await reorderChats(newOrderIds);
  };

  const pinnedChats = chats.filter(c => c.pinned);
  const unpinnedChats = chats.filter(c => !c.pinned);

  return (
    <div 
      className="w-64 flex flex-col h-screen"
      style={{
        background: 'rgba(255,255,255,0.35)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(200,200,200,0.25)',
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-subtle">
        <button
          onClick={handleCreateNewChat}
          className="w-full flex items-center gap-2 px-4 py-2.5 bg-bg-surface hover:bg-glass-white-hover rounded-full text-text-main transition-all duration-default shadow-soft hover:shadow-md hover:translate-y-[-1px]"
          style={{
            border: '1px solid var(--border-subtle)',
          }}
        >
          <PlusCircle size={18} strokeWidth={1.5} className="text-accent-primary" />
          <span className="text-sm font-medium">Nuova Chat</span>
        </button>
      </div>

      {/* Error Display */}
      {firestoreError && (
        <div className="p-3 mx-4 mt-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
          {firestoreError}
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {/* Pinned Section */}
        {pinnedChats.length > 0 && (
          <>
            <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
              Fissate
            </div>
            <div className="space-y-1">
              {pinnedChats.map((chat) => {
                const chatIdToUse = currentChatId || activeChatId;
                return (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === chatIdToUse}
                    onSelect={() => {
                      console.log('[SIDEBAR] Click chat ->', chat.id);
                      selectChat(chat.id);
                    }}
                  onRename={(title) => {
                    setEditingChatId(chat.id);
                    setEditTitle(title);
                  }}
                  onDelete={() => handleDelete(chat.id)}
                  onTogglePin={() => handleTogglePin(chat.id)}
                  isEditing={editingChatId === chat.id}
                  editTitle={editTitle}
                  onEditChange={setEditTitle}
                  onEditSave={() => handleRename(chat.id, chat.title)}
                  onEditCancel={() => {
                    setEditingChatId(null);
                    setEditTitle('');
                  }}
                  menuOpen={menuOpenId === chat.id}
                  onMenuToggle={() => {
                    const newMenuId = menuOpenId === chat.id ? null : chat.id;
                    console.log('[SIDEBAR] Open menu ->', newMenuId);
                    setMenuOpenId(newMenuId);
                  }}
                  isPinned={true}
                  canMove={false}
                  />
                );
              })}
            </div>
            <div className="h-px bg-border-subtle mx-3 my-3" />
          </>
        )}

        {/* Unpinned Section */}
        <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
          Tutte le chat
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={unpinnedChats.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1 px-2">
              {unpinnedChats.map((chat) => {
                const chatIdToUse = currentChatId || activeChatId;
                return (
                  <SortableChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === chatIdToUse}
                    onSelect={() => {
                      console.log('[SIDEBAR] Click chat ->', chat.id);
                      selectChat(chat.id);
                    }}
                  onRename={(title) => {
                    setEditingChatId(chat.id);
                    setEditTitle(title);
                  }}
                  onDelete={() => handleDelete(chat.id)}
                  onTogglePin={() => handleTogglePin(chat.id)}
                  onMoveUp={() => handleMoveUp(chat.id)}
                  onMoveDown={() => handleMoveDown(chat.id)}
                  isEditing={editingChatId === chat.id}
                  editTitle={editTitle}
                  onEditChange={setEditTitle}
                  onEditSave={() => handleRename(chat.id, chat.title)}
                  onEditCancel={() => {
                    setEditingChatId(null);
                    setEditTitle('');
                  }}
                  menuOpen={menuOpenId === chat.id}
                  onMenuToggle={() => {
                    const newMenuId = menuOpenId === chat.id ? null : chat.id;
                    console.log('[SIDEBAR] Open menu ->', newMenuId);
                    setMenuOpenId(newMenuId);
                  }}
                  isPinned={false}
                  canMove={true}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {chats.length === 0 && !loading && (
          <div className="p-4 text-center text-text-muted text-sm">
            Nessuna chat. Crea una nuova chat per iniziare.
          </div>
        )}

        {loading && (
          <div className="p-4 text-center text-text-muted text-sm">
            Caricamento...
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Sortable Chat Item (for drag & drop)
 * NOTE: Drag listeners are only on the drag handle, not the whole row
 */
const SortableChatItem = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.chat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Don't apply drag listeners to the whole item - only allow dragging from a handle
  // This prevents interference with click handlers
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ChatItem {...props} />
    </div>
  );
};

/**
 * Chat Item Component
 */
const ChatItem = ({
  chat,
  isActive,
  onSelect,
  onRename,
  onDelete,
  onTogglePin,
  onMoveUp,
  onMoveDown,
  isEditing,
  editTitle,
  onEditChange,
  onEditSave,
  onEditCancel,
  menuOpen,
  onMenuToggle,
  isPinned,
  canMove,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onEditSave();
    } else if (e.key === 'Escape') {
      onEditCancel();
    }
  };

  return (
    <div
      className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-full cursor-pointer transition-all duration-default ${
        isActive
          ? 'bg-accent-primary/8 border border-accent-primary/25'
          : isPinned
          ? 'bg-accent-primary/12 hover:bg-glass-white-hover'
          : 'bg-transparent hover:bg-glass-white-hover'
      }`}
      style={{
        ...(isActive && {
          boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
        }),
        ...(!isActive && {
          transform: 'translateX(0)',
        }),
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.transform = 'translateX(2px)';
          e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.04)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      onClick={(e) => {
        if (!isEditing && onSelect) {
          e.stopPropagation();
          onSelect();
        }
      }}
    >
      {isPinned && (
        <Pin size={14} strokeWidth={1.5} className="text-accent-primary flex-shrink-0" fill="currentColor" />
      )}

      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onEditSave}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-bg-surface border border-border-subtle text-text-main px-3 py-1.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="flex-1 truncate text-sm text-text-main font-medium">{chat.title}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-default">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMenuToggle();
              }}
              className="p-1.5 hover:bg-glass-white-hover rounded-full transition-all duration-fast"
            >
              <MoreVertical size={16} strokeWidth={1.5} className="text-text-muted" />
            </button>
          </div>
        </>
      )}

      {/* Menu Dropdown */}
      {menuOpen && !isEditing && (
        <div
          className="chat-item-menu absolute right-2 top-full mt-2 w-48 bg-bg-surface border border-border-subtle rounded-lg shadow-lg z-50 overflow-hidden"
          style={{
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRename(chat.title);
              onMenuToggle();
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-text-main hover:bg-glass-white-hover flex items-center gap-2.5 transition-all duration-fast"
          >
            <Edit3 size={16} strokeWidth={1.5} className="text-text-muted" />
            Rinomina
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-text-main hover:bg-glass-white-hover flex items-center gap-2.5 transition-all duration-fast"
          >
            <Pin size={16} strokeWidth={1.5} className={`text-text-muted ${isPinned ? 'fill-current' : ''}`} />
            {isPinned ? 'Rimuovi fissata' : 'Fissa'}
          </button>
          {canMove && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp();
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-text-main hover:bg-glass-white-hover flex items-center gap-2.5 transition-all duration-fast"
              >
                <ChevronUp size={16} strokeWidth={1.5} className="text-text-muted" />
                Sposta su
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown();
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-text-main hover:bg-glass-white-hover flex items-center gap-2.5 transition-all duration-fast"
              >
                <ChevronDown size={16} strokeWidth={1.5} className="text-text-muted" />
                Sposta giù
              </button>
            </>
          )}
          <div className="h-px bg-border-subtle my-1 mx-2" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-all duration-fast"
          >
            <Trash2 size={16} strokeWidth={1.5} />
            Elimina
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;

