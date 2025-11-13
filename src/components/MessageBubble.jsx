/**
 * MessageBubble Component
 * Displays individual chat messages with different styling for user and assistant
 */
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  const hasImages = message.images && message.images.length > 0;

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}
    >
      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-100'
        } transition-all duration-200`}
      >
        {/* Images */}
        {hasImages && (
          <div className={`mb-2 ${message.content ? 'mb-3' : ''}`}>
            <div className="grid grid-cols-2 gap-2">
              {message.images.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Image ${index + 1}`}
                    className="w-full h-auto rounded-lg object-cover max-h-64 cursor-pointer"
                    onClick={() => window.open(imageUrl, '_blank')}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Text Content */}
        {message.content && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;

