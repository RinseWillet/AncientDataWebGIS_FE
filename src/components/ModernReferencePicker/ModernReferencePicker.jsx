import { useState, useEffect } from "react";
import ModernReferenceService from "../../services/ModernReferenceService";
import "./ModernReferencePicker.css";

const ModernReferencePicker = ({ selectedReferences = [], onChange }) => {
    const [allRefs, setAllRefs] = useState([]);
    const [newRef, setNewRef] = useState({ shortRef: "", fullRef: "", url: "" });

    useEffect(() => {
        ModernReferenceService.findAll()
            .then(res => {                
                if (Array.isArray(res.data)) {
                    setAllRefs(res.data);
                } else {
                    console.error("Unexpected response format for references", res.data);
                    setAllRefs([]);
                }
            })
            .catch(err => {
                console.error("Failed to fetch references:", err);
                setAllRefs([]);
            });
    }, []);

    const handleAddExisting = (refId) => {
        const found = allRefs.find(ref => ref.id === parseInt(refId));
        if (found && !selectedReferences.some(r => r.id === found.id)) {
            onChange([...selectedReferences, found]);
        }
    };

    const handleRemove = (refId) => {
        onChange(selectedReferences.filter(ref => ref.id !== refId));
    };

    const handleCreateNew = async () => {
        try {
            const response = await ModernReferenceService.create(newRef);
            onChange([...selectedReferences, response.data]);
            setNewRef({ shortRef: "", fullRef: "", url: "" });
        } catch (err) {
            console.error("Failed to create reference:", err);
        }
    };

    return (
        <div className="modref-picker">
            <h4>Linked References</h4>
            <ul>
                {selectedReferences.map(ref => (
                    <li key={ref.id}>
                        {ref.fullRef}
                        <button onClick={() => handleRemove(ref.id)}>Remove</button>
                    </li>
                ))}
            </ul>

            <h4>Add Existing</h4>
            <select onChange={(e) => handleAddExisting(e.target.value)}>
                <option value="">-- Select --</option>
                {allRefs.map(ref => (
                    <option key={ref.id} value={ref.id}>{ref.shortRef}</option>
                ))}
            </select>

            <h4>Add New</h4>
            <input
                type="text"
                placeholder="Short Ref"
                value={newRef.shortRef}
                onChange={(e) => setNewRef({ ...newRef, shortRef: e.target.value })}
            />
            <input
                type="text"
                placeholder="Full Ref"
                value={newRef.fullRef}
                onChange={(e) => setNewRef({ ...newRef, fullRef: e.target.value })}
            />
            <input
                type="text"
                placeholder="URL (optional)"
                value={newRef.url}
                onChange={(e) => setNewRef({ ...newRef, url: e.target.value })}
            />
            <button onClick={handleCreateNew}>Create</button>
        </div>
    );
};

export default ModernReferencePicker;
